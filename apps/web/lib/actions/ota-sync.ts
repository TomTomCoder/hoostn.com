'use server';

/**
 * OTA Sync Server Actions
 * Server-side actions for managing OTA synchronization and conflicts
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { syncAirbnbICal } from '@/lib/ota/sync/airbnb-sync';
import type {
  OTASyncLog,
  OTASyncLogWithConnection,
  OTAConflict,
  OTAConflictWithDetails,
  SyncResult,
  ResolveConflictInput,
  OTAStats,
} from '@/types/ota';

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
 * Trigger manual sync for a connection
 */
export async function triggerManualSync(
  connectionId: string
): Promise<ActionResult<SyncResult>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify connection belongs to user's org
    const { data: connection, error: connectionError } = await supabase
      .from('ota_connections')
      .select('org_id, platform')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection || connection.org_id !== auth.orgId) {
      return { success: false, error: 'Connection not found or access denied' };
    }

    // Trigger sync based on platform
    let result: SyncResult;

    if (connection.platform === 'airbnb_ical') {
      result = await syncAirbnbICal(connectionId, 'user');
    } else {
      return {
        success: false,
        error: `Sync not implemented for platform: ${connection.platform}`,
      };
    }

    revalidatePath('/dashboard/ota');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in triggerManualSync:', error);
    const errorMsg = error instanceof Error ? error.message : 'Sync failed';
    return { success: false, error: errorMsg };
  }
}

/**
 * Get sync logs for a connection
 */
export async function getSyncLogs(
  connectionId?: string,
  limit: number = 50
): Promise<ActionResult<OTASyncLogWithConnection[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    let query = supabase
      .from('ota_sync_logs')
      .select(
        `
        *,
        connection:ota_connections (
          id,
          platform,
          lot_id
        )
      `
      )
      .eq('org_id', auth.orgId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (connectionId) {
      query = query.eq('connection_id', connectionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sync logs:', error);
      return { success: false, error: 'Failed to fetch sync logs' };
    }

    return { success: true, data: data as OTASyncLogWithConnection[] };
  } catch (error) {
    console.error('Error in getSyncLogs:', error);
    return { success: false, error: 'Failed to fetch sync logs' };
  }
}

/**
 * Get conflicts for the organization
 */
export async function getConflicts(
  status?: 'unresolved' | 'resolved' | 'ignored'
): Promise<ActionResult<OTAConflictWithDetails[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    let query = supabase
      .from('ota_conflicts')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          property_id
        ),
        connection:ota_connections (
          id,
          platform
        ),
        local_reservation:reservations (
          id,
          guest_name,
          check_in,
          check_out,
          total_price,
          status
        )
      `
      )
      .eq('org_id', auth.orgId)
      .order('detected_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conflicts:', error);
      return { success: false, error: 'Failed to fetch conflicts' };
    }

    return { success: true, data: data as OTAConflictWithDetails[] };
  } catch (error) {
    console.error('Error in getConflicts:', error);
    return { success: false, error: 'Failed to fetch conflicts' };
  }
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(
  conflictId: string,
  input: ResolveConflictInput
): Promise<ActionResult<OTAConflict>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify conflict belongs to user's org
    const { data: conflict, error: fetchError } = await supabase
      .from('ota_conflicts')
      .select('*')
      .eq('id', conflictId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !conflict) {
      return { success: false, error: 'Conflict not found or access denied' };
    }

    // Handle resolution action
    if (input.resolution_action === 'keep_local') {
      // Keep local reservation, mark remote as ignored
      // No changes to reservations needed
    } else if (input.resolution_action === 'keep_remote') {
      // Cancel local reservation if it exists
      if (conflict.local_reservation_id) {
        await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', conflict.local_reservation_id);
      }
      // Note: Remote booking would need to be imported separately
    } else if (input.resolution_action === 'cancelled_both') {
      // Cancel local reservation
      if (conflict.local_reservation_id) {
        await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', conflict.local_reservation_id);
      }
      // Note: Remote booking cancellation would need to be done on the platform
    }
    // 'manual_merge' requires manual intervention - just mark as resolved

    // Update conflict status
    const { data, error } = await supabase
      .from('ota_conflicts')
      .update({
        status: 'resolved',
        resolution_action: input.resolution_action,
        resolved_by: auth.userId,
        resolved_at: new Date().toISOString(),
        notes: input.notes,
      })
      .eq('id', conflictId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving conflict:', error);
      return { success: false, error: 'Failed to resolve conflict' };
    }

    revalidatePath('/dashboard/ota');
    return { success: true, data: data as OTAConflict };
  } catch (error) {
    console.error('Error in resolveConflict:', error);
    return { success: false, error: 'Failed to resolve conflict' };
  }
}

/**
 * Get OTA statistics for dashboard
 */
export async function getOTAStats(): Promise<ActionResult<OTAStats>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get connection counts
    const { data: connections } = await supabase
      .from('ota_connections')
      .select('status')
      .eq('org_id', auth.orgId);

    const totalConnections = connections?.length || 0;
    const activeConnections =
      connections?.filter((c) => c.status === 'active').length || 0;
    const errorConnections =
      connections?.filter((c) => c.status === 'error').length || 0;

    // Get unresolved conflicts count
    const { data: conflicts } = await supabase
      .from('ota_conflicts')
      .select('id')
      .eq('org_id', auth.orgId)
      .eq('status', 'unresolved');

    const unresolvedConflicts = conflicts?.length || 0;

    // Get sync stats for last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: recentSyncs } = await supabase
      .from('ota_sync_logs')
      .select('sync_type')
      .eq('org_id', auth.orgId)
      .gte('started_at', yesterday.toISOString());

    const last24hSyncs = recentSyncs?.length || 0;
    const last24hImports =
      recentSyncs?.filter((s) => s.sync_type === 'import').length || 0;

    const stats: OTAStats = {
      total_connections: totalConnections,
      active_connections: activeConnections,
      error_connections: errorConnections,
      unresolved_conflicts: unresolvedConflicts,
      last_24h_syncs: last24hSyncs,
      last_24h_imports: last24hImports,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getOTAStats:', error);
    return { success: false, error: 'Failed to fetch OTA statistics' };
  }
}

/**
 * Ignore a conflict (mark as resolved with 'ignored' status)
 */
export async function ignoreConflict(
  conflictId: string,
  notes?: string
): Promise<ActionResult<OTAConflict>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify conflict belongs to user's org
    const { data: existing } = await supabase
      .from('ota_conflicts')
      .select('id')
      .eq('id', conflictId)
      .eq('org_id', auth.orgId)
      .single();

    if (!existing) {
      return { success: false, error: 'Conflict not found or access denied' };
    }

    // Update conflict status to ignored
    const { data, error } = await supabase
      .from('ota_conflicts')
      .update({
        status: 'ignored',
        resolved_by: auth.userId,
        resolved_at: new Date().toISOString(),
        notes: notes,
      })
      .eq('id', conflictId)
      .select()
      .single();

    if (error) {
      console.error('Error ignoring conflict:', error);
      return { success: false, error: 'Failed to ignore conflict' };
    }

    revalidatePath('/dashboard/ota');
    return { success: true, data: data as OTAConflict };
  } catch (error) {
    console.error('Error in ignoreConflict:', error);
    return { success: false, error: 'Failed to ignore conflict' };
  }
}
