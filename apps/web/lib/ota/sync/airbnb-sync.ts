/**
 * Airbnb iCal Sync
 * Handles synchronization of Airbnb reservations via iCal feed
 */

import { createClient } from '@/lib/supabase/server';
import { fetchAndParseICal } from '../ical/parser';
import {
  detectConflicts,
  getConflictDetails,
  determineConflictType,
  isValidDateRange,
  isDateInPast,
} from './conflict-resolver';
import type {
  SyncResult,
  ICalEvent,
  OTAConnection,
  TriggeredBy,
} from '@/types/ota';
import type { Reservation } from '@/types/booking';

/**
 * Maximum number of events to process per sync to prevent timeouts
 */
const MAX_EVENTS_PER_SYNC = 100;

/**
 * Maximum consecutive errors before auto-pausing connection
 */
const MAX_ERROR_COUNT = 5;

/**
 * Sync Airbnb iCal feed for a connection
 * @param connectionId - OTA connection ID
 * @param triggeredBy - Who/what triggered the sync
 * @returns Sync result with statistics
 */
export async function syncAirbnbICal(
  connectionId: string,
  triggeredBy: TriggeredBy = 'system'
): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = {
    success: false,
    items_processed: 0,
    items_created: 0,
    items_updated: 0,
    items_failed: 0,
    conflicts: [],
    errors: [],
  };

  let syncLogId: string | undefined;

  try {
    // 1. Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('ota_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // Check if connection is active
    if (connection.status !== 'active') {
      throw new Error(`Connection is not active: ${connection.status}`);
    }

    // Get import URL from config
    const importUrl = connection.config?.import_url;
    if (!importUrl) {
      throw new Error('Import URL not configured');
    }

    // 2. Create sync log
    const { data: syncLog, error: syncLogError } = await supabase
      .from('ota_sync_logs')
      .insert({
        connection_id: connectionId,
        org_id: connection.org_id,
        sync_type: triggeredBy === 'user' ? 'manual' : 'scheduled',
        direction: 'inbound',
        status: 'success',
        triggered_by: triggeredBy,
      })
      .select()
      .single();

    if (syncLogError || !syncLog) {
      console.error('Failed to create sync log:', syncLogError);
    } else {
      syncLogId = syncLog.id;
      result.sync_log_id = syncLogId;
    }

    // 3. Fetch and parse iCal feed
    let events: ICalEvent[];
    try {
      events = await fetchAndParseICal(importUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Failed to fetch iCal: ${errorMsg}`);
      throw new Error(`Failed to fetch iCal: ${errorMsg}`);
    }

    // Limit number of events to process
    if (events.length > MAX_EVENTS_PER_SYNC) {
      console.warn(
        `Limiting sync to ${MAX_EVENTS_PER_SYNC} events (found ${events.length})`
      );
      events = events.slice(0, MAX_EVENTS_PER_SYNC);
    }

    // 4. Get existing reservations for this connection
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('ota_connection_id', connectionId);

    const existingMap = new Map<string, Reservation>();
    if (existingReservations) {
      for (const res of existingReservations as Reservation[]) {
        if (res.ota_booking_id) {
          existingMap.set(res.ota_booking_id, res);
        }
      }
    }

    // 5. Process each event
    for (const event of events) {
      result.items_processed++;

      try {
        const processResult = await processICalEvent(
          event,
          connection,
          existingMap
        );

        if (processResult.created) result.items_created++;
        if (processResult.updated) result.items_updated++;
        if (processResult.skipped) continue;
        if (processResult.conflict) {
          result.conflicts.push(processResult.conflict);
        }
      } catch (error) {
        result.items_failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Event ${event.uid}: ${errorMsg}`);
        console.error(`Failed to process event ${event.uid}:`, error);
      }
    }

    // 6. Update connection sync status
    const nextSyncAt = new Date();
    nextSyncAt.setMinutes(
      nextSyncAt.getMinutes() + connection.sync_frequency_minutes
    );

    await supabase
      .from('ota_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        next_sync_at: nextSyncAt.toISOString(),
        error_count: 0,
        last_error: null,
      })
      .eq('id', connectionId);

    // 7. Update sync log
    if (syncLogId) {
      await supabase
        .from('ota_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          status: result.errors.length > 0 ? 'partial_success' : 'success',
          items_processed: result.items_processed,
          items_created: result.items_created,
          items_updated: result.items_updated,
          items_failed: result.items_failed,
          error_message:
            result.errors.length > 0 ? result.errors.join('; ') : null,
        })
        .eq('id', syncLogId);
    }

    result.success = true;
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
    result.errors.push(errorMsg);

    // Update connection error count
    const { data: connection } = await supabase
      .from('ota_connections')
      .select('error_count')
      .eq('id', connectionId)
      .single();

    const newErrorCount = (connection?.error_count || 0) + 1;

    await supabase
      .from('ota_connections')
      .update({
        error_count: newErrorCount,
        last_error: errorMsg,
        status: newErrorCount >= MAX_ERROR_COUNT ? 'error' : 'active',
      })
      .eq('id', connectionId);

    // Update sync log with error
    if (syncLogId) {
      await supabase
        .from('ota_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'error',
          error_message: errorMsg,
          items_processed: result.items_processed,
          items_created: result.items_created,
          items_updated: result.items_updated,
          items_failed: result.items_failed,
        })
        .eq('id', syncLogId);
    }

    return result;
  }
}

/**
 * Process a single iCal event
 */
async function processICalEvent(
  event: ICalEvent,
  connection: OTAConnection,
  existingReservations: Map<string, Reservation>
): Promise<{
  created: boolean;
  updated: boolean;
  skipped: boolean;
  conflict?: {
    remote_booking_id: string;
    conflict_type: 'double_booking' | 'date_overlap' | 'cancellation_sync';
    message: string;
  };
}> {
  const supabase = await createClient();
  const result = {
    created: false,
    updated: false,
    skipped: false,
    conflict: undefined as any,
  };

  // Extract dates from event
  const checkIn = event.dtstart.split('T')[0]; // Extract date part
  const checkOut = event.dtend.split('T')[0];

  // Validate date range
  if (!isValidDateRange(checkIn, checkOut)) {
    console.warn(`Invalid date range for event ${event.uid}`);
    result.skipped = true;
    return result;
  }

  // Skip past bookings
  if (isDateInPast(checkOut)) {
    result.skipped = true;
    return result;
  }

  // Handle cancellation status
  const isCancelled = event.status?.toUpperCase() === 'CANCELLED';

  // Check if reservation already exists
  const existingReservation = existingReservations.get(event.uid);

  if (existingReservation) {
    // Update existing reservation
    if (isCancelled) {
      // Cancel the reservation
      await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          ota_sync_status: 'synced',
          ota_last_synced_at: new Date().toISOString(),
        })
        .eq('id', existingReservation.id);

      result.updated = true;
    } else {
      // Check if dates changed
      if (
        existingReservation.check_in !== checkIn ||
        existingReservation.check_out !== checkOut
      ) {
        // Dates changed - check for conflicts
        const hasConflict = await detectConflicts(
          connection.lot_id,
          checkIn,
          checkOut,
          existingReservation.id
        );

        if (hasConflict) {
          // Log conflict
          const conflictType = determineConflictType(
            existingReservation.check_in,
            existingReservation.check_out,
            checkIn,
            checkOut
          );

          const conflictingReservations = await getConflictDetails(
            connection.lot_id,
            checkIn,
            checkOut,
            existingReservation.id
          );

          await supabase.from('ota_conflicts').insert({
            org_id: connection.org_id,
            lot_id: connection.lot_id,
            connection_id: connection.id,
            conflict_type: conflictType,
            status: 'unresolved',
            severity: 'high',
            local_reservation_id:
              conflictingReservations[0]?.id || existingReservation.id,
            remote_booking_id: event.uid,
            conflict_data: {
              local_dates: {
                check_in: existingReservation.check_in,
                check_out: existingReservation.check_out,
              },
              remote_dates: {
                check_in: checkIn,
                check_out: checkOut,
              },
              description: `Date change detected for booking ${event.uid}`,
            },
          });

          result.conflict = {
            remote_booking_id: event.uid,
            conflict_type: conflictType,
            message: 'Date change conflicts with existing reservation',
          };

          // Don't update the reservation - let user resolve conflict
          return result;
        }

        // No conflict - update reservation
        await supabase
          .from('reservations')
          .update({
            check_in: checkIn,
            check_out: checkOut,
            ota_sync_status: 'synced',
            ota_last_synced_at: new Date().toISOString(),
          })
          .eq('id', existingReservation.id);

        result.updated = true;
      } else {
        // No changes - just update sync timestamp
        await supabase
          .from('reservations')
          .update({
            ota_sync_status: 'synced',
            ota_last_synced_at: new Date().toISOString(),
          })
          .eq('id', existingReservation.id);

        result.skipped = true;
      }
    }

    return result;
  }

  // New reservation - check for conflicts
  if (!isCancelled) {
    const hasConflict = await detectConflicts(connection.lot_id, checkIn, checkOut);

    if (hasConflict) {
      // Log conflict
      const conflictingReservations = await getConflictDetails(
        connection.lot_id,
        checkIn,
        checkOut
      );

      await supabase.from('ota_conflicts').insert({
        org_id: connection.org_id,
        lot_id: connection.lot_id,
        connection_id: connection.id,
        conflict_type: 'double_booking',
        status: 'unresolved',
        severity: 'critical',
        local_reservation_id: conflictingReservations[0]?.id || null,
        remote_booking_id: event.uid,
        conflict_data: {
          remote_dates: {
            check_in: checkIn,
            check_out: checkOut,
          },
          local_dates: conflictingReservations[0]
            ? {
                check_in: conflictingReservations[0].check_in,
                check_out: conflictingReservations[0].check_out,
              }
            : undefined,
          description: `New Airbnb booking conflicts with existing reservation`,
        },
      });

      result.conflict = {
        remote_booking_id: event.uid,
        conflict_type: 'double_booking',
        message: 'New booking conflicts with existing reservation',
      };

      return result;
    }

    // No conflict - create new reservation
    const guestName = event.summary || 'Airbnb Guest';

    await supabase.from('reservations').insert({
      lot_id: connection.lot_id,
      org_id: connection.org_id,
      guest_name: guestName,
      guest_email: 'guest@airbnb.com', // iCal doesn't provide real email
      guest_phone: null,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: 1, // iCal doesn't provide guest count
      total_price: 0, // iCal doesn't provide price
      status: 'confirmed',
      channel: 'airbnb',
      ota_connection_id: connection.id,
      ota_booking_id: event.uid,
      ota_sync_status: 'synced',
      ota_last_synced_at: new Date().toISOString(),
      ota_metadata: {
        platform: 'airbnb_ical',
        imported_at: new Date().toISOString(),
        original_summary: event.summary,
        ical_uid: event.uid,
      },
      payment_status: 'paid', // Assume Airbnb bookings are paid
    });

    result.created = true;
  }

  return result;
}
