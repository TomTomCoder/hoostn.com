'use server';

/**
 * Calendar Server Actions
 * Server-side actions for fetching and managing calendar data
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  CalendarEvent,
  CalendarFilters,
  PropertyWithLots,
  BulkBlockInput,
  CalendarMetrics,
} from '@/types/calendar';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get current user and organization ID
 */
async function getUserAndOrg(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get org_id from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (error || !userData?.org_id) {
    console.error('Failed to get user org_id:', error);
    return null;
  }

  return {
    userId: user.id,
    orgId: userData.org_id,
  };
}

/**
 * Get calendar events (reservations + blocked dates) for specified filters and date range
 * @param filters - Calendar filters
 * @param dateRange - Date range to fetch events for
 */
export async function getCalendarEvents(
  filters: CalendarFilters,
  dateRange: { start: string; end: string }
): Promise<ActionResult<CalendarEvent[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const events: CalendarEvent[] = [];

    // Build lot filter
    let lotIds = filters.lotIds;

    // If property filters are specified, get all lots for those properties
    if (filters.propertyIds.length > 0) {
      const { data: propertyLots, error: lotsError } = await supabase
        .from('lots')
        .select('id')
        .eq('org_id', auth.orgId)
        .in('property_id', filters.propertyIds);

      if (lotsError) {
        console.error('Error fetching property lots:', lotsError);
        return { success: false, error: 'Failed to fetch lots' };
      }

      const propertyLotIds = propertyLots.map((l) => l.id);

      // Combine with specific lot filters
      if (lotIds.length > 0) {
        lotIds = lotIds.filter((id) => propertyLotIds.includes(id));
      } else {
        lotIds = propertyLotIds;
      }
    }

    // If no lots selected after filtering, return empty
    if (lotIds.length === 0 && (filters.propertyIds.length > 0 || filters.lotIds.length > 0)) {
      return { success: true, data: [] };
    }

    // Fetch reservations
    let reservationsQuery = supabase
      .from('reservations')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          property_id,
          property:properties (
            id,
            name
          )
        )
      `
      )
      .eq('org_id', auth.orgId)
      .not('status', 'eq', 'cancelled')
      .lte('check_in', dateRange.end)
      .gte('check_out', dateRange.start);

    // Apply lot filter
    if (lotIds.length > 0) {
      reservationsQuery = reservationsQuery.in('lot_id', lotIds);
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      reservationsQuery = reservationsQuery.in('status', filters.statuses);
    }

    const { data: reservations, error: resError } = await reservationsQuery;

    if (resError) {
      console.error('Error fetching reservations:', resError);
      return { success: false, error: 'Failed to fetch reservations' };
    }

    // Transform reservations to calendar events
    if (reservations) {
      for (const res of reservations) {
        if (!res.lot) continue;

        events.push({
          id: res.id,
          lotId: res.lot_id,
          lotTitle: res.lot.title,
          propertyId: res.lot.property_id,
          propertyName: res.lot.property?.name || 'Unknown',
          type: 'reservation',
          startDate: res.check_in,
          endDate: res.check_out,
          guestName: res.guest_name,
          guestEmail: res.guest_email,
          guestsCount: res.guests_count,
          totalPrice: res.total_price,
          status: res.status,
          channel: res.channel,
        });
      }
    }

    // Fetch blocked dates (availability rules)
    if (filters.showBlocked) {
      let rulesQuery = supabase
        .from('availability_rules')
        .select(
          `
          *,
          lot:lots (
            id,
            title,
            property_id,
            property:properties (
              id,
              name
            )
          )
        `
        )
        .eq('org_id', auth.orgId)
        .eq('rule_type', 'blocked')
        .lte('start_date', dateRange.end)
        .gte('end_date', dateRange.start);

      // Apply lot filter
      if (lotIds.length > 0) {
        rulesQuery = rulesQuery.in('lot_id', lotIds);
      }

      const { data: rules, error: rulesError } = await rulesQuery;

      if (rulesError) {
        console.error('Error fetching availability rules:', rulesError);
        // Don't fail, just skip blocked dates
      } else if (rules) {
        for (const rule of rules) {
          if (!rule.lot) continue;

          events.push({
            id: rule.id,
            lotId: rule.lot_id,
            lotTitle: rule.lot.title,
            propertyId: rule.lot.property_id,
            propertyName: rule.lot.property?.name || 'Unknown',
            type: 'blocked',
            startDate: rule.start_date,
            endDate: rule.end_date,
            reason: rule.reason || 'Blocked',
            ruleType: rule.rule_type,
          });
        }
      }
    }

    return { success: true, data: events };
  } catch (error) {
    console.error('Unexpected error fetching calendar events:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get properties with their lots for filter dropdowns
 */
export async function getPropertiesWithLots(): Promise<ActionResult<PropertyWithLots[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('properties')
      .select(
        `
        id,
        name,
        lots (
          id,
          title,
          status
        )
      `
      )
      .eq('org_id', auth.orgId)
      .order('name');

    if (error) {
      console.error('Error fetching properties with lots:', error);
      return { success: false, error: 'Failed to fetch properties' };
    }

    const properties: PropertyWithLots[] = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      lots: (p.lots || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        status: l.status,
      })),
    }));

    return { success: true, data: properties };
  } catch (error) {
    console.error('Unexpected error fetching properties:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Bulk block dates across multiple lots
 * @param input - Bulk blocking parameters
 */
export async function bulkBlockDates(
  input: BulkBlockInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate input
    if (input.lotIds.length === 0) {
      return { success: false, error: 'No lots selected' };
    }

    if (new Date(input.startDate) > new Date(input.endDate)) {
      return { success: false, error: 'Start date must be before end date' };
    }

    const supabase = await createClient();

    // Verify all lots belong to user's org
    const { data: lots, error: lotsError } = await supabase
      .from('lots')
      .select('id')
      .eq('org_id', auth.orgId)
      .in('id', input.lotIds);

    if (lotsError || !lots || lots.length !== input.lotIds.length) {
      return { success: false, error: 'Invalid lot selection' };
    }

    // Check for conflicting reservations
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id, lot_id')
      .eq('org_id', auth.orgId)
      .in('lot_id', input.lotIds)
      .not('status', 'eq', 'cancelled')
      .lte('check_in', input.endDate)
      .gte('check_out', input.startDate);

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return { success: false, error: 'Failed to check for conflicts' };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: `Cannot block dates: ${conflicts.length} existing reservation(s) found`,
      };
    }

    // Create availability rules for each lot
    const rules = input.lotIds.map((lotId) => ({
      lot_id: lotId,
      org_id: auth.orgId,
      start_date: input.startDate,
      end_date: input.endDate,
      rule_type: 'blocked' as const,
      reason: input.reason,
    }));

    const { data, error } = await supabase
      .from('availability_rules')
      .insert(rules)
      .select();

    if (error) {
      console.error('Error creating availability rules:', error);
      return { success: false, error: 'Failed to block dates' };
    }

    revalidatePath('/dashboard/calendar');

    return { success: true, data: { count: data.length } };
  } catch (error) {
    console.error('Unexpected error blocking dates:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get calendar metrics for selected lots and date range
 * @param lotIds - Array of lot IDs
 * @param dateRange - Date range to calculate metrics for
 */
export async function getCalendarMetrics(
  lotIds: string[],
  dateRange: { start: string; end: string }
): Promise<ActionResult<CalendarMetrics[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    if (lotIds.length === 0) {
      return { success: true, data: [] };
    }

    // Calculate total days in range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const metrics: CalendarMetrics[] = [];

    for (const lotId of lotIds) {
      // Get reservations for this lot in date range
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('check_in, check_out, total_price')
        .eq('lot_id', lotId)
        .eq('org_id', auth.orgId)
        .eq('payment_status', 'paid')
        .not('status', 'eq', 'cancelled')
        .lte('check_in', dateRange.end)
        .gte('check_out', dateRange.start);

      if (resError) {
        console.error('Error fetching reservations for metrics:', resError);
        continue;
      }

      // Calculate metrics
      let bookedDays = 0;
      let totalRevenue = 0;
      const bookingCount = reservations?.length || 0;

      if (reservations) {
        for (const res of reservations) {
          const checkIn = new Date(res.check_in);
          const checkOut = new Date(res.check_out);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          bookedDays += nights;
          totalRevenue += res.total_price || 0;
        }
      }

      // Get blocked days
      const { data: rules, error: rulesError } = await supabase
        .from('availability_rules')
        .select('start_date, end_date')
        .eq('lot_id', lotId)
        .eq('org_id', auth.orgId)
        .eq('rule_type', 'blocked')
        .lte('start_date', dateRange.end)
        .gte('end_date', dateRange.start);

      let blockedDays = 0;
      if (rules) {
        for (const rule of rules) {
          const ruleStart = new Date(rule.start_date);
          const ruleEnd = new Date(rule.end_date);
          const days = Math.ceil((ruleEnd.getTime() - ruleStart.getTime()) / (1000 * 60 * 60 * 24));
          blockedDays += days;
        }
      }

      metrics.push({
        lotId,
        dateRange,
        occupancyRate: totalDays > 0 ? bookedDays / totalDays : 0,
        totalRevenue,
        bookingCount,
        averageNightlyRate: bookedDays > 0 ? totalRevenue / bookedDays : 0,
        blockedDays,
      });
    }

    return { success: true, data: metrics };
  } catch (error) {
    console.error('Unexpected error calculating metrics:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
