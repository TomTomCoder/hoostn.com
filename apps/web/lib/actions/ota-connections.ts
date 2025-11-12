'use server';

/**
 * OTA Connections Server Actions
 * Server-side actions for managing OTA platform connections
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  OTAConnection,
  OTAConnectionWithLot,
  CreateOTAConnectionInput,
  UpdateOTAConnectionInput,
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
 * Get all OTA connections for the current organization
 */
export async function getOTAConnections(): Promise<
  ActionResult<OTAConnectionWithLot[]>
> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ota_connections')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          property_id
        )
      `
      )
      .eq('org_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching OTA connections:', error);
      return { success: false, error: 'Failed to fetch OTA connections' };
    }

    return { success: true, data: data as OTAConnectionWithLot[] };
  } catch (error) {
    console.error('Error in getOTAConnections:', error);
    return { success: false, error: 'Failed to fetch OTA connections' };
  }
}

/**
 * Get a single OTA connection by ID
 */
export async function getOTAConnectionById(
  id: string
): Promise<ActionResult<OTAConnectionWithLot>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ota_connections')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          property_id
        )
      `
      )
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error) {
      console.error('Error fetching OTA connection:', error);
      return { success: false, error: 'OTA connection not found' };
    }

    return { success: true, data: data as OTAConnectionWithLot };
  } catch (error) {
    console.error('Error in getOTAConnectionById:', error);
    return { success: false, error: 'Failed to fetch OTA connection' };
  }
}

/**
 * Create a new OTA connection
 */
export async function createOTAConnection(
  input: CreateOTAConnectionInput
): Promise<ActionResult<OTAConnection>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate input
    if (!input.lot_id || !input.platform) {
      return { success: false, error: 'Lot ID and platform are required' };
    }

    // Validate import URL if provided
    if (input.config?.import_url) {
      if (!input.config.import_url.startsWith('https://')) {
        return {
          success: false,
          error: 'Import URL must use HTTPS protocol',
        };
      }
    }

    const supabase = await createClient();

    // Check if lot belongs to user's org
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('org_id')
      .eq('id', input.lot_id)
      .single();

    if (lotError || !lot || lot.org_id !== auth.orgId) {
      return { success: false, error: 'Lot not found or access denied' };
    }

    // Calculate next sync time
    const syncFrequency = input.sync_frequency_minutes || 30;
    const nextSyncAt = new Date();
    nextSyncAt.setMinutes(nextSyncAt.getMinutes() + syncFrequency);

    // Create connection
    const { data, error } = await supabase
      .from('ota_connections')
      .insert({
        org_id: auth.orgId,
        lot_id: input.lot_id,
        platform: input.platform,
        config: input.config,
        sync_frequency_minutes: syncFrequency,
        next_sync_at: nextSyncAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating OTA connection:', error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Connection already exists for this lot and platform',
        };
      }
      return { success: false, error: 'Failed to create OTA connection' };
    }

    revalidatePath('/dashboard/ota');
    return { success: true, data: data as OTAConnection };
  } catch (error) {
    console.error('Error in createOTAConnection:', error);
    return { success: false, error: 'Failed to create OTA connection' };
  }
}

/**
 * Update an OTA connection
 */
export async function updateOTAConnection(
  id: string,
  input: UpdateOTAConnectionInput
): Promise<ActionResult<OTAConnection>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('ota_connections')
      .select('*')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'OTA connection not found' };
    }

    // Build update object
    const updates: any = {};

    if (input.status !== undefined) {
      updates.status = input.status;
    }

    if (input.config !== undefined) {
      // Merge with existing config
      updates.config = {
        ...existing.config,
        ...input.config,
      };

      // Validate import URL if being updated
      if (updates.config.import_url) {
        if (!updates.config.import_url.startsWith('https://')) {
          return {
            success: false,
            error: 'Import URL must use HTTPS protocol',
          };
        }
      }
    }

    if (input.sync_frequency_minutes !== undefined) {
      updates.sync_frequency_minutes = input.sync_frequency_minutes;

      // Recalculate next sync time
      const nextSyncAt = new Date();
      nextSyncAt.setMinutes(
        nextSyncAt.getMinutes() + input.sync_frequency_minutes
      );
      updates.next_sync_at = nextSyncAt.toISOString();
    }

    // Update connection
    const { data, error } = await supabase
      .from('ota_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating OTA connection:', error);
      return { success: false, error: 'Failed to update OTA connection' };
    }

    revalidatePath('/dashboard/ota');
    return { success: true, data: data as OTAConnection };
  } catch (error) {
    console.error('Error in updateOTAConnection:', error);
    return { success: false, error: 'Failed to update OTA connection' };
  }
}

/**
 * Delete an OTA connection
 */
export async function deleteOTAConnection(
  id: string
): Promise<ActionResult<void>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('ota_connections')
      .select('id')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (!existing) {
      return { success: false, error: 'OTA connection not found' };
    }

    // Delete connection (cascade will handle related records)
    const { error } = await supabase
      .from('ota_connections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting OTA connection:', error);
      return { success: false, error: 'Failed to delete OTA connection' };
    }

    revalidatePath('/dashboard/ota');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error in deleteOTAConnection:', error);
    return { success: false, error: 'Failed to delete OTA connection' };
  }
}

/**
 * Get OTA connections for a specific lot
 */
export async function getOTAConnectionsByLot(
  lotId: string
): Promise<ActionResult<OTAConnection[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ota_connections')
      .select('*')
      .eq('lot_id', lotId)
      .eq('org_id', auth.orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching OTA connections for lot:', error);
      return { success: false, error: 'Failed to fetch OTA connections' };
    }

    return { success: true, data: data as OTAConnection[] };
  } catch (error) {
    console.error('Error in getOTAConnectionsByLot:', error);
    return { success: false, error: 'Failed to fetch OTA connections' };
  }
}
