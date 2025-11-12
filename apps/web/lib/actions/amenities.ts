'use server';

/**
 * Amenity Management Server Actions
 * Server-side actions for managing amenities and lot-amenity assignments
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Amenity, LotAmenity, AmenitiesByCategory } from '@/types/amenity';
import { amenityAssignmentSchema, bulkAmenityUpdateSchema } from '@/lib/validations/lot';

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
 * List all available amenities
 * Returns all amenities from the catalog (no auth required as it's read-only catalog)
 *
 * @returns List of all amenities or error
 */
export async function listAmenities(): Promise<ActionResult<Amenity[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to fetch amenities:', error);
      return {
        success: false,
        error: 'Failed to fetch amenities. Please try again.',
      };
    }

    return { success: true, data: (data as Amenity[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching amenities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * List amenities grouped by category
 *
 * @returns Amenities grouped by category or error
 */
export async function listAmenitiesByCategory(): Promise<
  ActionResult<AmenitiesByCategory>
> {
  try {
    const result = await listAmenities();

    if (!result.success) {
      return result as ActionResult<AmenitiesByCategory>;
    }

    const amenities = result.data;

    const grouped: AmenitiesByCategory = {
      essential: amenities.filter((a) => a.category === 'essential'),
      kitchen: amenities.filter((a) => a.category === 'kitchen'),
      bathroom: amenities.filter((a) => a.category === 'bathroom'),
      entertainment: amenities.filter((a) => a.category === 'entertainment'),
      outdoor: amenities.filter((a) => a.category === 'outdoor'),
    };

    return { success: true, data: grouped };
  } catch (error) {
    console.error('Unexpected error grouping amenities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Add an amenity to a lot
 *
 * @param lotId - UUID of the lot
 * @param amenityId - UUID of the amenity
 * @param quantity - Quantity of this amenity (default: 1)
 * @param notes - Optional notes about this amenity
 * @returns Created lot-amenity assignment or error
 */
export async function addLotAmenity(
  lotId: string,
  amenityId: string,
  quantity: number = 1,
  notes?: string | null
): Promise<ActionResult<LotAmenity>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage amenities' };
    }

    // Validate input
    const validation = amenityAssignmentSchema.safeParse({
      lot_id: lotId,
      amenity_id: amenityId,
      quantity,
      notes,
    });

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

    // Verify amenity exists
    const { data: amenity, error: amenityError } = await supabase
      .from('amenities')
      .select('id')
      .eq('id', amenityId)
      .single();

    if (amenityError || !amenity) {
      return { success: false, error: 'Amenity not found' };
    }

    // Add amenity to lot (upsert to handle duplicates)
    const { data, error } = await supabase
      .from('lot_amenities')
      .upsert(
        {
          lot_id: lotId,
          amenity_id: amenityId,
          quantity,
          notes: notes || null,
        },
        {
          onConflict: 'lot_id,amenity_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to add amenity to lot:', error);
      return {
        success: false,
        error: 'Failed to add amenity. Please try again.',
      };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: data as LotAmenity };
  } catch (error) {
    console.error('Unexpected error adding amenity:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Remove an amenity from a lot
 *
 * @param lotId - UUID of the lot
 * @param amenityId - UUID of the amenity to remove
 * @returns Success or error
 */
export async function removeLotAmenity(
  lotId: string,
  amenityId: string
): Promise<ActionResult<void>> {
  try {
    // Validate IDs
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success || !idSchema.safeParse(amenityId).success) {
      return { success: false, error: 'Invalid lot or amenity ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage amenities' };
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

    // Remove amenity from lot
    const { error } = await supabase
      .from('lot_amenities')
      .delete()
      .eq('lot_id', lotId)
      .eq('amenity_id', amenityId);

    if (error) {
      console.error('Failed to remove amenity from lot:', error);
      return {
        success: false,
        error: 'Failed to remove amenity. Please try again.',
      };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error removing amenity:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update amenities for a lot (bulk operation)
 * This replaces all existing amenities with the provided list
 *
 * @param lotId - UUID of the lot
 * @param amenities - Array of amenities with quantity and notes
 * @returns Success or error
 */
export async function updateLotAmenities(
  lotId: string,
  amenities: Array<{
    amenity_id: string;
    quantity: number;
    notes?: string | null;
  }>
): Promise<ActionResult<LotAmenity[]>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to manage amenities' };
    }

    // Validate input
    const validation = bulkAmenityUpdateSchema.safeParse({
      lot_id: lotId,
      amenities,
    });

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

    // Delete existing amenities
    await supabase.from('lot_amenities').delete().eq('lot_id', lotId);

    // Insert new amenities (if any)
    if (amenities.length > 0) {
      const insertData = amenities.map((a) => ({
        lot_id: lotId,
        amenity_id: a.amenity_id,
        quantity: a.quantity,
        notes: a.notes || null,
      }));

      const { data, error } = await supabase
        .from('lot_amenities')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Failed to update lot amenities:', error);
        return {
          success: false,
          error: 'Failed to update amenities. Please try again.',
        };
      }

      // Revalidate lot page
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
      revalidatePath(`/lots/${lotId}`);

      return { success: true, data: (data as LotAmenity[]) || [] };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: [] };
  } catch (error) {
    console.error('Unexpected error updating amenities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get amenities for a specific lot
 *
 * @param lotId - UUID of the lot
 * @returns List of lot amenities with details or error
 */
export async function getLotAmenities(
  lotId: string
): Promise<ActionResult<LotAmenity[]>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view amenities' };
    }

    const supabase = await createClient();

    // Fetch lot amenities
    const { data, error } = await supabase
      .from('lot_amenities')
      .select(
        `
        *,
        amenities (
          id,
          name,
          category,
          icon
        )
      `
      )
      .eq('lot_id', lotId);

    if (error) {
      console.error('Failed to fetch lot amenities:', error);
      return {
        success: false,
        error: 'Failed to fetch amenities. Please try again.',
      };
    }

    return { success: true, data: (data as LotAmenity[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching lot amenities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
