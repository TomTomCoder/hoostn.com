'use server';

/**
 * Pricing Seasons Server Actions
 * Server-side actions for managing seasonal pricing rules
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { PricingSeason } from '@/types/lot';
import { pricingSeasonSchema, dateRangeSchema } from '@/lib/validations/lot';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

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
 * Create a pricing season
 *
 * @param lotId - UUID of the lot
 * @param data - Pricing season data
 * @returns Created pricing season or error
 */
export async function createPricingSeason(
  lotId: string,
  data: z.infer<typeof pricingSeasonSchema>
): Promise<ActionResult<PricingSeason>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage pricing' };
    }

    // Validate input
    const validation = pricingSeasonSchema.safeParse({ ...data, lot_id: lotId });
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = await createClient();

    // Verify lot exists and belongs to user's org
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('id, org_id, property_id')
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .single();

    if (lotError || !lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Check for overlapping pricing seasons
    const { data: overlapping, error: overlapError } = await supabase
      .from('lot_pricing_seasons')
      .select('id, name')
      .eq('lot_id', lotId)
      .or(`start_date.lte.${data.end_date},end_date.gte.${data.start_date}`)
      .limit(1);

    if (overlapError) {
      console.error('Failed to check for overlapping seasons:', overlapError);
    } else if (overlapping && overlapping.length > 0) {
      return {
        success: false,
        error: `Overlapping with existing season: ${overlapping[0].name}`,
      };
    }

    // Create pricing season
    const { data: season, error } = await supabase
      .from('lot_pricing_seasons')
      .insert({
        lot_id: lotId,
        org_id: auth.orgId,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        price_per_night: data.price_per_night,
        min_nights: data.min_nights || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create pricing season:', error);
      return {
        success: false,
        error: 'Failed to create pricing season. Please try again.',
      };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: season as PricingSeason };
  } catch (error) {
    console.error('Unexpected error creating pricing season:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update a pricing season
 *
 * @param seasonId - UUID of the season to update
 * @param data - Partial pricing season data
 * @returns Updated pricing season or error
 */
export async function updatePricingSeason(
  seasonId: string,
  data: Partial<z.infer<typeof pricingSeasonSchema>>
): Promise<ActionResult<PricingSeason>> {
  try {
    // Validate season ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(seasonId).success) {
      return { success: false, error: 'Invalid season ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage pricing' };
    }

    const supabase = await createClient();

    // Check season exists and belongs to user's org
    const { data: existingSeason, error: fetchError } = await supabase
      .from('lot_pricing_seasons')
      .select('id, lot_id, org_id')
      .eq('id', seasonId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !existingSeason) {
      return { success: false, error: 'Pricing season not found' };
    }

    // Get lot info for revalidation
    const { data: lot } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', existingSeason.lot_id)
      .single();

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.price_per_night !== undefined) updateData.price_per_night = data.price_per_night;
    if (data.min_nights !== undefined) updateData.min_nights = data.min_nights;

    // Update season
    const { data: updatedSeason, error } = await supabase
      .from('lot_pricing_seasons')
      .update(updateData)
      .eq('id', seasonId)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update pricing season:', error);
      return {
        success: false,
        error: 'Failed to update pricing season. Please try again.',
      };
    }

    // Revalidate lot page
    if (lot?.property_id) {
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${existingSeason.lot_id}`);
      revalidatePath(`/lots/${existingSeason.lot_id}`);
    }

    return { success: true, data: updatedSeason as PricingSeason };
  } catch (error) {
    console.error('Unexpected error updating pricing season:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete a pricing season
 *
 * @param seasonId - UUID of the season to delete
 * @returns Success or error
 */
export async function deletePricingSeason(seasonId: string): Promise<ActionResult<void>> {
  try {
    // Validate season ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(seasonId).success) {
      return { success: false, error: 'Invalid season ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage pricing' };
    }

    const supabase = await createClient();

    // Get season info for revalidation
    const { data: season, error: fetchError } = await supabase
      .from('lot_pricing_seasons')
      .select('lot_id')
      .eq('id', seasonId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !season) {
      return { success: false, error: 'Pricing season not found' };
    }

    // Get lot info for revalidation
    const { data: lot } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', season.lot_id)
      .single();

    // Delete season
    const { error } = await supabase
      .from('lot_pricing_seasons')
      .delete()
      .eq('id', seasonId)
      .eq('org_id', auth.orgId);

    if (error) {
      console.error('Failed to delete pricing season:', error);
      return {
        success: false,
        error: 'Failed to delete pricing season. Please try again.',
      };
    }

    // Revalidate lot page
    if (lot?.property_id) {
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${season.lot_id}`);
      revalidatePath(`/lots/${season.lot_id}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error deleting pricing season:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * List pricing seasons for a lot
 *
 * @param lotId - UUID of the lot
 * @returns List of pricing seasons or error
 */
export async function listPricingSeasons(
  lotId: string
): Promise<ActionResult<PricingSeason[]>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view pricing seasons' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('lot_pricing_seasons')
      .select('*')
      .eq('lot_id', lotId)
      .eq('org_id', auth.orgId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch pricing seasons:', error);
      return {
        success: false,
        error: 'Failed to fetch pricing seasons. Please try again.',
      };
    }

    return { success: true, data: (data as PricingSeason[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching pricing seasons:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get active pricing season for a specific date
 *
 * @param lotId - UUID of the lot
 * @param date - Date to check (YYYY-MM-DD)
 * @returns Active pricing season or null
 */
export async function getActivePricingSeason(
  lotId: string,
  date: string
): Promise<ActionResult<PricingSeason | null>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Validate date
    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
    if (!dateSchema.safeParse(date).success) {
      return { success: false, error: 'Invalid date format' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view pricing seasons' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('lot_pricing_seasons')
      .select('*')
      .eq('lot_id', lotId)
      .eq('org_id', auth.orgId)
      .lte('start_date', date)
      .gte('end_date', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No matching season found is not an error
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      console.error('Failed to fetch active pricing season:', error);
      return {
        success: false,
        error: 'Failed to fetch pricing season. Please try again.',
      };
    }

    return { success: true, data: data as PricingSeason };
  } catch (error) {
    console.error('Unexpected error fetching active pricing season:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get pricing seasons within a date range
 * Useful for displaying seasonal pricing in calendar
 *
 * @param lotId - UUID of the lot
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns List of pricing seasons within range or error
 */
export async function getPricingSeasonsInRange(
  lotId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult<PricingSeason[]>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Validate date range
    const validation = dateRangeSchema.safeParse({
      start_date: startDate,
      end_date: endDate,
    });

    if (!validation.success) {
      return { success: false, error: 'Invalid date range' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view pricing seasons' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('lot_pricing_seasons')
      .select('*')
      .eq('lot_id', lotId)
      .eq('org_id', auth.orgId)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch pricing seasons in range:', error);
      return {
        success: false,
        error: 'Failed to fetch pricing seasons. Please try again.',
      };
    }

    return { success: true, data: (data as PricingSeason[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching pricing seasons in range:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
