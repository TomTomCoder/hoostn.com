'use server';

/**
 * Lot CRUD Server Actions
 * Server-side actions for managing lots (units) with validation and RLS
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Lot, LotWithImages, LotWithDetails, LotFilters } from '@/types/lot';
import { createLotSchema, updateLotSchema } from '@/lib/validations/lot';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Get current user and organization ID
 * @returns User ID and org ID or null if not authenticated
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
 * Create a new lot
 * @param propertyId - UUID of the parent property
 * @param data - Lot form data
 * @returns Created lot or error
 */
export async function createLot(
  propertyId: string,
  data: z.infer<typeof createLotSchema>
): Promise<ActionResult<Lot>> {
  try {
    // Validate property ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(propertyId).success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to create lots' };
    }

    const supabase = await createClient();

    // Verify property exists and belongs to user's org
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, org_id')
      .eq('id', propertyId)
      .eq('org_id', auth.orgId)
      .single();

    if (propertyError || !property) {
      return { success: false, error: 'Property not found' };
    }

    // Validate input data
    const validation = createLotSchema.safeParse({ ...data, property_id: propertyId });
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Insert lot into database
    const { data: lot, error } = await supabase
      .from('lots')
      .insert({
        property_id: propertyId,
        org_id: auth.orgId,
        title: data.title,
        description: data.description || null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        max_guests: data.max_guests,
        base_price: data.base_price || null,
        cleaning_fee: data.cleaning_fee || 0,
        tourist_tax: data.tourist_tax || 0,
        pets_allowed: data.pets_allowed || false,
        status: data.status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create lot:', error);
      return {
        success: false,
        error: 'Failed to create lot. Please try again.',
      };
    }

    // Revalidate relevant pages
    revalidatePath(`/dashboard/properties/${propertyId}`);
    revalidatePath(`/dashboard/properties/${propertyId}/lots`);
    revalidatePath('/dashboard');

    return { success: true, data: lot };
  } catch (error) {
    console.error('Unexpected error creating lot:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update an existing lot
 * @param lotId - Lot ID to update
 * @param data - Partial lot data to update
 * @returns Updated lot or error
 */
export async function updateLot(
  lotId: string,
  data: Partial<z.infer<typeof updateLotSchema>>
): Promise<ActionResult<Lot>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to update lots' };
    }

    const supabase = await createClient();

    // Check lot exists and belongs to user's org
    const { data: existingLot, error: fetchError } = await supabase
      .from('lots')
      .select('id, org_id, property_id')
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !existingLot) {
      return { success: false, error: 'Lot not found' };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
    if (data.max_guests !== undefined) updateData.max_guests = data.max_guests;
    if (data.base_price !== undefined) updateData.base_price = data.base_price;
    if (data.cleaning_fee !== undefined) updateData.cleaning_fee = data.cleaning_fee;
    if (data.tourist_tax !== undefined) updateData.tourist_tax = data.tourist_tax;
    if (data.pets_allowed !== undefined) updateData.pets_allowed = data.pets_allowed;
    if (data.status !== undefined) updateData.status = data.status;

    // Update lot
    const { data: updatedLot, error } = await supabase
      .from('lots')
      .update(updateData)
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update lot:', error);
      return {
        success: false,
        error: 'Failed to update lot. Please try again.',
      };
    }

    // Revalidate relevant pages
    revalidatePath(`/dashboard/properties/${existingLot.property_id}`);
    revalidatePath(`/dashboard/properties/${existingLot.property_id}/lots`);
    revalidatePath(`/dashboard/properties/${existingLot.property_id}/lots/${lotId}`);
    revalidatePath('/dashboard');

    return { success: true, data: updatedLot };
  } catch (error) {
    console.error('Unexpected error updating lot:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete a lot
 * @param lotId - Lot ID to delete
 * @returns Success or error
 */
export async function deleteLot(lotId: string): Promise<ActionResult<void>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to delete lots' };
    }

    const supabase = await createClient();

    // Get lot info for revalidation
    const { data: lot, error: fetchError } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Delete lot (cascades to images, amenities, etc.)
    const { error } = await supabase
      .from('lots')
      .delete()
      .eq('id', lotId)
      .eq('org_id', auth.orgId);

    if (error) {
      console.error('Failed to delete lot:', error);
      return {
        success: false,
        error: 'Failed to delete lot. Please try again.',
      };
    }

    // Revalidate relevant pages
    revalidatePath(`/dashboard/properties/${lot.property_id}`);
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots`);
    revalidatePath('/dashboard');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error deleting lot:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get a lot by ID with images, amenities, and pricing
 * @param lotId - Lot ID
 * @returns Complete lot data or error
 */
export async function getLotById(lotId: string): Promise<ActionResult<LotWithDetails>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view lots' };
    }

    const supabase = await createClient();

    // Fetch lot with related data
    const { data: lot, error } = await supabase
      .from('lots')
      .select(
        `
        *,
        lot_images (
          id,
          lot_id,
          org_id,
          storage_path,
          filename,
          file_size,
          mime_type,
          width,
          height,
          display_order,
          is_primary,
          created_at
        ),
        lot_amenities (
          id,
          lot_id,
          amenity_id,
          quantity,
          notes
        ),
        availability_rules (
          id,
          lot_id,
          org_id,
          start_date,
          end_date,
          rule_type,
          price_per_night,
          min_nights,
          reason,
          created_at
        ),
        lot_pricing_seasons (
          id,
          lot_id,
          org_id,
          name,
          start_date,
          end_date,
          price_per_night,
          min_nights,
          created_at
        )
      `
      )
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !lot) {
      return { success: false, error: 'Lot not found' };
    }

    // Transform data
    const images = Array.isArray(lot.lot_images) ? lot.lot_images : [];
    const primaryImage = images.find((img: { is_primary: boolean }) => img.is_primary);

    const lotWithDetails: LotWithDetails = {
      ...lot,
      images: images.sort((a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
      ),
      amenities: Array.isArray(lot.lot_amenities) ? lot.lot_amenities : [],
      availability_rules: Array.isArray(lot.availability_rules) ? lot.availability_rules : [],
      pricing_seasons: Array.isArray(lot.lot_pricing_seasons) ? lot.lot_pricing_seasons : [],
      primary_image_path: primaryImage?.storage_path || null,
      image_count: images.length,
    };

    return { success: true, data: lotWithDetails };
  } catch (error) {
    console.error('Unexpected error fetching lot:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * List lots with filters and pagination
 * @param propertyId - Property ID to filter by
 * @param filters - Additional filters
 * @returns List of lots or error
 */
export async function listLots(
  propertyId: string,
  filters?: LotFilters
): Promise<ActionResult<LotWithImages[]>> {
  try {
    // Validate property ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(propertyId).success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view lots' };
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('lots')
      .select(
        `
        *,
        lot_images!lot_images_lot_id_fkey (
          id,
          storage_path,
          is_primary,
          display_order
        )
      `
      )
      .eq('property_id', propertyId)
      .eq('org_id', auth.orgId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.min_bedrooms !== undefined) {
      query = query.gte('bedrooms', filters.min_bedrooms);
    }

    if (filters?.max_bedrooms !== undefined) {
      query = query.lte('bedrooms', filters.max_bedrooms);
    }

    if (filters?.min_bathrooms !== undefined) {
      query = query.gte('bathrooms', filters.min_bathrooms);
    }

    if (filters?.max_bathrooms !== undefined) {
      query = query.lte('bathrooms', filters.max_bathrooms);
    }

    if (filters?.min_guests !== undefined) {
      query = query.gte('max_guests', filters.min_guests);
    }

    if (filters?.max_guests !== undefined) {
      query = query.lte('max_guests', filters.max_guests);
    }

    if (filters?.pets_allowed !== undefined) {
      query = query.eq('pets_allowed', filters.pets_allowed);
    }

    if (filters?.min_price !== undefined) {
      query = query.gte('base_price', filters.min_price);
    }

    if (filters?.max_price !== undefined) {
      query = query.lte('base_price', filters.max_price);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch lots:', error);
      return {
        success: false,
        error: 'Failed to fetch lots. Please try again.',
      };
    }

    // Transform data
    const lots: LotWithImages[] = (data || []).map((lot) => {
      const images = Array.isArray(lot.lot_images) ? lot.lot_images : [];
      const primaryImage = images.find((img: { is_primary: boolean }) => img.is_primary);

      return {
        ...lot,
        images: images.sort((a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
        ),
        primary_image_path: primaryImage?.storage_path || null,
        image_count: images.length,
      };
    });

    return { success: true, data: lots };
  } catch (error) {
    console.error('Unexpected error fetching lots:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get lot count for a property
 * @param propertyId - Property ID
 * @returns Count of lots or error
 */
export async function getLotCount(propertyId: string): Promise<ActionResult<number>> {
  try {
    // Validate property ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(propertyId).success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view lots' };
    }

    const supabase = await createClient();

    const { count, error } = await supabase
      .from('lots')
      .select('id', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('org_id', auth.orgId);

    if (error) {
      console.error('Failed to count lots:', error);
      return {
        success: false,
        error: 'Failed to count lots. Please try again.',
      };
    }

    return { success: true, data: count || 0 };
  } catch (error) {
    console.error('Unexpected error counting lots:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
