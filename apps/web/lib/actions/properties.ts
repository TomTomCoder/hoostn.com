'use server';

/**
 * Property CRUD Server Actions
 * Server-side actions for managing properties with validation, geocoding, and RLS
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { geocodeAddress, GeocodingError } from '@/lib/geocoding/mapbox';
import type { PropertyFormData } from '@/lib/validations/property';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Property data type from database
 */
export interface Property {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Property with image count
 */
export interface PropertyWithImages extends Property {
  image_count: number;
  primary_image_path: string | null;
}

/**
 * Property with lots/units for list views
 */
export interface PropertyWithLots extends Property {
  lots: Array<{
    id: string;
    title: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    base_price?: number;
    status?: string;
  }>;
}

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
 * Create a new property
 * @param formData - Property form data from client
 * @returns Created property or error
 */
export async function createProperty(
  formData: PropertyFormData
): Promise<ActionResult<Property>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to create properties' };
    }

    // Geocode address if coordinates not provided
    let latitude = formData.latitude;
    let longitude = formData.longitude;
    let geocodedAddress = formData.street;
    let geocodedCity = formData.city;
    let geocodedPostalCode = formData.postalCode;

    if (!latitude || !longitude) {
      try {
        const fullAddress = [
          formData.street,
          formData.city,
          formData.state,
          formData.postalCode,
          formData.country,
        ]
          .filter(Boolean)
          .join(', ');

        const geocodeResult = await geocodeAddress(fullAddress, {
          country: formData.country,
        });

        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        geocodedCity = geocodeResult.city || formData.city;
        geocodedPostalCode = geocodeResult.postal_code || formData.postalCode;
      } catch (error) {
        if (error instanceof GeocodingError) {
          return {
            success: false,
            error: `Failed to geocode address: ${error.message}`,
          };
        }
        // Continue without coordinates if geocoding fails
        console.warn('Geocoding failed, creating property without coordinates:', error);
      }
    }

    // Insert property into database
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('properties')
      .insert({
        org_id: auth.orgId,
        name: formData.name,
        description: formData.description || null,
        address: geocodedAddress,
        city: geocodedCity,
        postal_code: geocodedPostalCode || null,
        country: formData.country,
        latitude,
        longitude,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create property:', error);
      return {
        success: false,
        error: 'Failed to create property. Please try again.',
      };
    }

    // Revalidate properties list page
    revalidatePath('/properties');
    revalidatePath('/dashboard');

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error creating property:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update an existing property
 * @param id - Property ID to update
 * @param formData - Partial property data to update
 * @returns Updated property or error
 */
export async function updateProperty(
  id: string,
  formData: Partial<PropertyFormData>
): Promise<ActionResult<Property>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    const idValidation = idSchema.safeParse(id);

    if (!idValidation.success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to update properties' };
    }

    const supabase = await createClient();

    // Check property exists and belongs to user's org
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !existingProperty) {
      return { success: false, error: 'Property not found' };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.description !== undefined) updateData.description = formData.description;
    if (formData.street !== undefined) updateData.address = formData.street;
    if (formData.city !== undefined) updateData.city = formData.city;
    if (formData.postalCode !== undefined) updateData.postal_code = formData.postalCode;
    if (formData.country !== undefined) updateData.country = formData.country;

    // Re-geocode if address fields changed and coordinates not provided
    const addressChanged =
      formData.street !== undefined ||
      formData.city !== undefined ||
      formData.postalCode !== undefined ||
      formData.country !== undefined;

    if (addressChanged && !formData.latitude && !formData.longitude) {
      try {
        // Fetch current property data to build complete address
        const { data: currentProperty } = await supabase
          .from('properties')
          .select('address, city, postal_code, country')
          .eq('id', id)
          .single();

        const fullAddress = [
          formData.street || currentProperty?.address,
          formData.city || currentProperty?.city,
          formData.postalCode || currentProperty?.postal_code,
          formData.country || currentProperty?.country,
        ]
          .filter(Boolean)
          .join(', ');

        const geocodeResult = await geocodeAddress(fullAddress, {
          country: formData.country || currentProperty?.country,
        });

        updateData.latitude = geocodeResult.latitude;
        updateData.longitude = geocodeResult.longitude;
        updateData.city = geocodeResult.city || formData.city;
        updateData.postal_code = geocodeResult.postal_code || formData.postalCode;
      } catch (error) {
        console.warn('Geocoding failed during update:', error);
        // Continue without updating coordinates
      }
    } else if (formData.latitude !== undefined && formData.longitude !== undefined) {
      updateData.latitude = formData.latitude;
      updateData.longitude = formData.longitude;
    }

    // Update property
    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update property:', error);
      return {
        success: false,
        error: 'Failed to update property. Please try again.',
      };
    }

    // Revalidate relevant pages
    revalidatePath('/properties');
    revalidatePath(`/properties/${id}`);
    revalidatePath('/dashboard');

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error updating property:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete a property
 * @param id - Property ID to delete
 * @returns Success or error
 */
export async function deleteProperty(id: string): Promise<ActionResult<void>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    const idValidation = idSchema.safeParse(id);

    if (!idValidation.success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to delete properties' };
    }

    const supabase = await createClient();

    // Delete property (cascades to images and lots via database constraints)
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('org_id', auth.orgId);

    if (error) {
      console.error('Failed to delete property:', error);
      return {
        success: false,
        error: 'Failed to delete property. Please try again.',
      };
    }

    // Revalidate properties list page
    revalidatePath('/properties');
    revalidatePath('/dashboard');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error deleting property:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get all properties for current user's organization
 * @param options - Query options
 * @returns List of properties or error
 */
export async function getProperties(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}): Promise<ActionResult<PropertyWithImages[]>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view properties' };
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('properties')
      .select(
        `
        *,
        property_images!property_images_property_id_fkey(id, storage_path, is_primary)
      `
      )
      .eq('org_id', auth.orgId);

    // Apply search filter
    if (options?.search) {
      query = query.or(
        `name.ilike.%${options.search}%,address.ilike.%${options.search}%,city.ilike.%${options.search}%`
      );
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch properties:', error);
      return {
        success: false,
        error: 'Failed to fetch properties. Please try again.',
      };
    }

    // Transform data to include image count and primary image
    const properties: PropertyWithImages[] = (data || []).map((property) => {
      const images = Array.isArray(property.property_images)
        ? property.property_images
        : [];
      const primaryImage = images.find((img: { is_primary: boolean }) => img.is_primary);

      return {
        id: property.id,
        org_id: property.org_id,
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        postal_code: property.postal_code,
        country: property.country,
        latitude: property.latitude,
        longitude: property.longitude,
        created_at: property.created_at,
        updated_at: property.updated_at,
        image_count: images.length,
        primary_image_path: primaryImage?.storage_path || null,
      };
    });

    return { success: true, data: properties };
  } catch (error) {
    console.error('Unexpected error fetching properties:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get a single property by ID
 * @param id - Property ID
 * @returns Property data or error
 */
export async function getPropertyById(
  id: string
): Promise<ActionResult<PropertyWithImages>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    const idValidation = idSchema.safeParse(id);

    if (!idValidation.success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view properties' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('properties')
      .select(
        `
        *,
        property_images!property_images_property_id_fkey(id, storage_path, is_primary)
      `
      )
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Property not found' };
    }

    // Transform data to include image count and primary image
    const images = Array.isArray(data.property_images) ? data.property_images : [];
    const primaryImage = images.find((img: { is_primary: boolean }) => img.is_primary);

    const property: PropertyWithImages = {
      id: data.id,
      org_id: data.org_id,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      created_at: data.created_at,
      updated_at: data.updated_at,
      image_count: images.length,
      primary_image_path: primaryImage?.storage_path || null,
    };

    return { success: true, data: property };
  } catch (error) {
    console.error('Unexpected error fetching property:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Backwards compatibility alias
 */
export const getProperty = getPropertyById;

/**
 * Get unique cities from properties for filter dropdown
 * @returns List of unique cities or error
 */
export async function getPropertyCities(): Promise<ActionResult<string[]>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view properties' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('properties')
      .select('city')
      .eq('org_id', auth.orgId)
      .order('city');

    if (error) {
      console.error('Failed to fetch cities:', error);
      return {
        success: false,
        error: 'Failed to fetch cities. Please try again.',
      };
    }

    // Extract unique cities
    const cities = Array.from(new Set((data || []).map((p) => p.city))).filter(
      Boolean
    ) as string[];

    return { success: true, data: cities };
  } catch (error) {
    console.error('Unexpected error fetching cities:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get properties with lots for list views
 * @param options - Query options including city filter
 * @returns List of properties with lots or error
 */
export async function getPropertiesWithLots(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  city?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}): Promise<ActionResult<PropertyWithLots[]>> {
  try {
    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view properties' };
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('properties')
      .select(
        `
        *,
        lots (
          id,
          title,
          bedrooms,
          bathrooms,
          max_guests,
          base_price,
          status
        )
      `
      )
      .eq('org_id', auth.orgId);

    // Apply search filter
    if (options?.search) {
      query = query.or(
        `name.ilike.%${options.search}%,address.ilike.%${options.search}%,city.ilike.%${options.search}%,description.ilike.%${options.search}%`
      );
    }

    // Apply city filter
    if (options?.city) {
      query = query.eq('city', options.city);
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch properties:', error);
      return {
        success: false,
        error: 'Failed to fetch properties. Please try again.',
      };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching properties:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get a single property with lots by ID
 * @param id - Property ID
 * @returns Property data with lots or error
 */
export async function getPropertyWithLotsById(
  id: string
): Promise<ActionResult<PropertyWithLots>> {
  try {
    // Validate ID
    const idSchema = z.string().uuid();
    const idValidation = idSchema.safeParse(id);

    if (!idValidation.success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view properties' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('properties')
      .select(
        `
        *,
        lots (
          id,
          title,
          bedrooms,
          bathrooms,
          max_guests,
          base_price,
          status
        )
      `
      )
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Property not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error fetching property:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
