'use server';

/**
 * Lot Image Management Server Actions
 * Server-side actions for managing lot image uploads to Supabase Storage
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { LotImage } from '@/types/lot';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Storage bucket name for lot images
 */
const LOT_IMAGES_BUCKET = 'lot-images';

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
 * Upload a lot image to Supabase Storage
 *
 * @param lotId - UUID of the lot
 * @param file - File to upload (must be validated on client)
 * @param options - Upload options (dimensions, display order, etc.)
 * @returns Created image record or error
 */
export async function uploadLotImage(
  lotId: string,
  file: File,
  options?: {
    width?: number;
    height?: number;
    displayOrder?: number;
    isPrimary?: boolean;
  }
): Promise<ActionResult<LotImage>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to upload images' };
    }

    // Verify lot exists and belongs to user's org
    const supabase = await createClient();

    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('id, org_id, property_id')
      .eq('id', lotId)
      .eq('org_id', auth.orgId)
      .single();

    if (lotError || !lot) {
      return { success: false, error: 'Lot not found' };
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

    // Create storage path: {org_id}/lots/{lot_id}/{filename}
    const storagePath = `${auth.orgId}/lots/${lotId}/${filename}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(LOT_IMAGES_BUCKET)
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
      .from('lot_images')
      .insert({
        lot_id: lotId,
        org_id: auth.orgId,
        storage_path: storagePath,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        width: options?.width || null,
        height: options?.height || null,
        display_order: options?.displayOrder || 0,
        is_primary: options?.isPrimary || false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to create image record:', dbError);

      // Clean up uploaded file if database insert fails
      await supabase.storage.from(LOT_IMAGES_BUCKET).remove([storagePath]);

      return {
        success: false,
        error: 'Failed to save image metadata. Please try again.',
      };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: imageRecord as LotImage };
  } catch (error) {
    console.error('Unexpected error uploading image:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete a lot image
 *
 * @param imageId - UUID of the image to delete
 * @returns Success or error
 */
export async function deleteLotImage(imageId: string): Promise<ActionResult> {
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
      .from('lot_images')
      .select('id, lot_id, org_id, storage_path')
      .eq('id', imageId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !image) {
      return { success: false, error: 'Image not found' };
    }

    // Get lot info for revalidation
    const { data: lot } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', image.lot_id)
      .single();

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(LOT_IMAGES_BUCKET)
      .remove([image.storage_path]);

    if (storageError) {
      console.error('Failed to delete image from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('lot_images')
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

    // Revalidate lot page
    if (lot?.property_id) {
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${image.lot_id}`);
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots`);
      revalidatePath(`/lots/${image.lot_id}`);
    }

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
 * Reorder lot images
 *
 * @param lotId - UUID of the lot
 * @param imageIds - Array of image IDs in desired order
 * @returns Success or error
 */
export async function reorderLotImages(
  lotId: string,
  imageIds: string[]
): Promise<ActionResult> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Validate image IDs
    const idsSchema = z.array(z.string().uuid());
    if (!idsSchema.safeParse(imageIds).success) {
      return { success: false, error: 'Invalid image IDs' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to reorder images' };
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

    // Update display order for each image
    const updates = imageIds.map((imageId, index) =>
      supabase
        .from('lot_images')
        .update({ display_order: index })
        .eq('id', imageId)
        .eq('lot_id', lotId)
        .eq('org_id', auth.orgId)
    );

    const results = await Promise.all(updates);

    const failed = results.some((result) => result.error);
    if (failed) {
      console.error('Failed to reorder some images');
      return {
        success: false,
        error: 'Failed to reorder images. Please try again.',
      };
    }

    // Revalidate lot page
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${lotId}`);
    revalidatePath(`/dashboard/properties/${lot.property_id}/lots`);
    revalidatePath(`/lots/${lotId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Unexpected error reordering images:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Set an image as the primary image for a lot
 * This will automatically unset any other primary images for the lot
 *
 * @param imageId - UUID of the image to set as primary
 * @returns Success or error
 */
export async function setPrimaryLotImage(imageId: string): Promise<ActionResult> {
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

    // Get image to verify ownership
    const { data: image, error: fetchError } = await supabase
      .from('lot_images')
      .select('id, lot_id, org_id')
      .eq('id', imageId)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError || !image) {
      return { success: false, error: 'Image not found' };
    }

    // Get lot info for revalidation
    const { data: lot } = await supabase
      .from('lots')
      .select('property_id')
      .eq('id', image.lot_id)
      .single();

    // First, unset all primary images for this lot
    await supabase
      .from('lot_images')
      .update({ is_primary: false })
      .eq('lot_id', image.lot_id)
      .eq('org_id', auth.orgId);

    // Then set this image as primary
    const { error } = await supabase
      .from('lot_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .eq('org_id', auth.orgId);

    if (error) {
      console.error('Failed to set primary image:', error);
      return {
        success: false,
        error: 'Failed to set primary image. Please try again.',
      };
    }

    // Revalidate lot page
    if (lot?.property_id) {
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots/${image.lot_id}`);
      revalidatePath(`/dashboard/properties/${lot.property_id}/lots`);
      revalidatePath(`/lots/${image.lot_id}`);
    }

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
 * Get all images for a lot
 *
 * @param lotId - UUID of the lot
 * @returns Array of images or error
 */
export async function getLotImages(lotId: string): Promise<ActionResult<LotImage[]>> {
  try {
    // Validate lot ID
    const idSchema = z.string().uuid();
    if (!idSchema.safeParse(lotId).success) {
      return { success: false, error: 'Invalid lot ID' };
    }

    // Get authenticated user and org
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'You must be logged in to view images' };
    }

    const supabase = await createClient();

    // Fetch images ordered by display_order
    const { data, error } = await supabase
      .from('lot_images')
      .select('*')
      .eq('lot_id', lotId)
      .eq('org_id', auth.orgId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch lot images:', error);
      return {
        success: false,
        error: 'Failed to fetch images. Please try again.',
      };
    }

    return { success: true, data: (data as LotImage[]) || [] };
  } catch (error) {
    console.error('Unexpected error fetching images:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get public URL for a lot image in storage
 *
 * @param storagePath - Storage path of the image
 * @returns Public URL or error
 */
export async function getLotImageUrl(storagePath: string): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();

    const { data } = supabase.storage.from(LOT_IMAGES_BUCKET).getPublicUrl(storagePath);

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
