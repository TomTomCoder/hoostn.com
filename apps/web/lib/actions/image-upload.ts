'use server';

/**
 * Image Upload Server Actions
 * Server-side actions for managing property image uploads to Supabase Storage
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { PropertyImage } from '@/types/image';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Storage bucket name for property images
 */
const PROPERTY_IMAGES_BUCKET = 'property-images';

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
 * Upload a property image to Supabase Storage
 *
 * @param propertyId - UUID of the property
 * @param file - File to upload (must be validated on client)
 * @param options - Upload options (dimensions, display order, etc.)
 * @returns Created image record or error
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File,
  options?: {
    width?: number;
    height?: number;
    displayOrder?: number;
    isPrimary?: boolean;
    altText?: string;
  }
): Promise<ActionResult<PropertyImage>> {
  try {
    // Validate property ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(propertyId).success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to upload images' };
    }

    // Verify property exists and belongs to user's org
    const supabase = await createClient();

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, org_id')
      .eq('id', propertyId)
      .eq('org_id', auth.orgId)
      .single();

    if (propertyError || !property) {
      return { success: false, error: 'Property not found' };
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds maximum of 10MB',
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Create storage path: {org_id}/properties/{property_id}/{filename}
    const storagePath = `${auth.orgId}/properties/${propertyId}/${filename}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload image to storage:', uploadError);
      return {
        success: false,
        error: 'Failed to upload image. Please try again.',
      };
    }

    // Create image metadata record in database
    const { data: imageRecord, error: dbError } = await supabase
      .from('property_images')
      .insert({
        property_id: propertyId,
        org_id: auth.orgId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        width: options?.width || null,
        height: options?.height || null,
        display_order: options?.displayOrder || 0,
        is_primary: options?.isPrimary || false,
        alt_text: options?.altText || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create image record:', dbError);

      // Clean up uploaded file if database insert fails
      await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([storagePath]);

      return {
        success: false,
        error: 'Failed to save image metadata. Please try again.',
      };
    }

    // Revalidate property page
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/properties');

    return { success: true, data: imageRecord as PropertyImage };
  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete a property image
 *
 * @param imageId - UUID of the image to delete
 * @returns Success or error
 */
export async function deletePropertyImage(imageId: string): Promise<ActionResult> {
  try {
    // Validate image ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(imageId).success) {
      return { success: false, error: 'Invalid image ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to delete images' };
    }

    const supabase = await createClient();

    // Get image record (to get storage path and verify ownership)
    const { data: image, error: fetchError } = await supabase
      .from('property_images')
      .select('id, property_id, org_id, storage_path')
      .eq('id', imageId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !image) {
      return { success: false, error: 'Image not found' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .remove([image.storage_path]);

    if (storageError) {
      console.error('Failed to delete image from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database (will cascade)
    const { error: dbError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId)
      .eq('org_id', auth.orgId);

    if (dbError) {
      console.error('Failed to delete image record:', dbError);
      return {
        success: false,
        error: 'Failed to delete image. Please try again.',
      };
    }

    // Revalidate property page
    revalidatePath(`/properties/${image.property_id}`);
    revalidatePath('/properties');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error deleting image:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update image display order
 *
 * @param imageId - UUID of the image
 * @param displayOrder - New display order (lower numbers appear first)
 * @returns Success or error
 */
export async function updateImageOrder(
  imageId: string,
  displayOrder: number
): Promise<ActionResult> {
  try {
    // Validate inputs
    const idSchema = z.string().uuid();
    const orderSchema = z.number().int().min(0);

    if (!idSchema.safeParse(imageId).success) {
      return { success: false, error: 'Invalid image ID' };
    }

    if (!orderSchema.safeParse(displayOrder).success) {
      return { success: false, error: 'Invalid display order' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to update images' };
    }

    const supabase = await createClient();

    // Update display order
    const { data, error } = await supabase
      .from('property_images')
      .update({ display_order: displayOrder })
      .eq('id', imageId)
      .eq('org_id', auth.orgId)
      .select('property_id')
      .single();

    if (error) {
      console.error('Failed to update image order:', error);
      return {
        success: false,
        error: 'Failed to update image order. Please try again.',
      };
    }

    // Revalidate property page
    if (data?.property_id) {
      revalidatePath(`/properties/${data.property_id}`);
    }
    revalidatePath('/properties');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error updating image order:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Set an image as the primary/hero image for a property
 * This will automatically unset any other primary images for the property
 *
 * @param imageId - UUID of the image to set as primary
 * @returns Success or error
 */
export async function setPrimaryImage(imageId: string): Promise<ActionResult> {
  try {
    // Validate image ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(imageId).success) {
      return { success: false, error: 'Invalid image ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to update images' };
    }

    const supabase = await createClient();

    // Update image to primary
    // Database trigger will automatically unset other primary images
    const { data, error } = await supabase
      .from('property_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('org_id', auth.orgId)
      .select('property_id')
      .single();

    if (error) {
      console.error('Failed to set primary image:', error);
      return {
        success: false,
        error: 'Failed to set primary image. Please try again.',
      };
    }

    // Revalidate property page
    if (data?.property_id) {
      revalidatePath(`/properties/${data.property_id}`);
    }
    revalidatePath('/properties');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error setting primary image:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update image alt text
 *
 * @param imageId - UUID of the image
 * @param altText - New alt text for accessibility
 * @returns Success or error
 */
export async function updateImageAltText(
  imageId: string,
  altText: string
): Promise<ActionResult> {
  try {
    // Validate inputs
    const idSchema = z.string().uuid();
    const altTextSchema = z.string().max(500);

    if (!idSchema.safeParse(imageId).success) {
      return { success: false, error: 'Invalid image ID' };
    }

    if (!altTextSchema.safeParse(altText).success) {
      return { success: false, error: 'Alt text must be 500 characters or less' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to update images' };
    }

    const supabase = await createClient();

    // Update alt text
    const { data, error } = await supabase
      .from('property_images')
      .update({ alt_text: altText })
      .eq('id', imageId)
      .eq('org_id', auth.orgId)
      .select('property_id')
      .single();

    if (error) {
      console.error('Failed to update image alt text:', error);
      return {
        success: false,
        error: 'Failed to update alt text. Please try again.',
      };
    }

    // Revalidate property page
    if (data?.property_id) {
      revalidatePath(`/properties/${data.property_id}`);
    }
    revalidatePath('/properties');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error updating alt text:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get all images for a property
 *
 * @param propertyId - UUID of the property
 * @returns Array of images or error
 */
export async function getPropertyImages(
  propertyId: string
): Promise<ActionResult<PropertyImage[]>> {
  try {
    // Validate property ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(propertyId).success) {
      return { success: false, error: 'Invalid property ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view images' };
    }

    const supabase = await createClient();

    // Fetch images ordered by display_order
    const { data, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .eq('org_id', auth.orgId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch property images:', error);
      return {
        success: false,
        error: 'Failed to fetch images. Please try again.',
      };
    }

    return { success: true, data: (data as PropertyImage[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching images:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get public URL for an image in storage
 *
 * @param storagePath - Storage path of the image
 * @returns Public URL or error
 */
export async function getImageUrl(storagePath: string): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();

    const { data } = supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    if (!data?.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate image URL',
      };
    }

    return { success: true, data: data.publicUrl };
  } catch (error) {
    console.error('Unexpected error getting image URL:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
