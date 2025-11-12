/**
 * Image Utility Functions
 * Browser-based utilities for image validation, processing, and upload preparation
 */

import type {
  ImageValidationResult,
  ImageDimensions,
  ImageUploadOptions,
  SupportedMimeType,
} from '@/types/image';
import { DEFAULT_IMAGE_OPTIONS, SUPPORTED_MIME_TYPES } from '@/types/image';

/**
 * Validate an image file against upload constraints
 * @param file - File to validate
 * @param options - Validation options (defaults to DEFAULT_IMAGE_OPTIONS)
 * @returns Validation result with error message if invalid
 */
export async function validateImageFile(
  file: File,
  options: ImageUploadOptions = DEFAULT_IMAGE_OPTIONS
): Promise<ImageValidationResult> {
  // Check file type
  if (!options.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > options.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatBytes(options.maxFileSize)}`,
    };
  }

  // Get image dimensions
  try {
    const dimensions = await getImageDimensions(file);

    // Check minimum dimensions
    if (options.minWidth && dimensions.width < options.minWidth) {
      return {
        valid: false,
        error: `Image width must be at least ${options.minWidth}px`,
      };
    }

    if (options.minHeight && dimensions.height < options.minHeight) {
      return {
        valid: false,
        error: `Image height must be at least ${options.minHeight}px`,
      };
    }

    // Check maximum dimensions
    if (options.maxWidth && dimensions.width > options.maxWidth) {
      return {
        valid: false,
        error: `Image width must not exceed ${options.maxWidth}px`,
      };
    }

    if (options.maxHeight && dimensions.height > options.maxHeight) {
      return {
        valid: false,
        error: `Image height must not exceed ${options.maxHeight}px`,
      };
    }

    return {
      valid: true,
      dimensions,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read image dimensions',
    };
  }
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get image dimensions from a file
 * @param file - Image file to measure
 * @returns Promise resolving to image dimensions
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Generate thumbnail from image file using Canvas API
 * @param file - Image file to generate thumbnail from
 * @param maxWidth - Maximum thumbnail width (default: 400)
 * @param maxHeight - Maximum thumbnail height (default: 300)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise resolving to Blob of thumbnail image
 */
export async function generateThumbnail(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 300,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate new dimensions while maintaining aspect ratio
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for thumbnail generation'));
    };

    img.src = objectUrl;
  });
}

/**
 * Generate unique filename with timestamp and random string
 * @param originalFilename - Original filename
 * @returns Sanitized unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  // Extract extension
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';

  // Sanitize filename (remove special characters)
  const sanitizedName = originalFilename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length

  // Generate timestamp and random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);

  return `${sanitizedName}-${timestamp}-${randomString}.${extension}`;
}

/**
 * Create storage path for image in Supabase Storage
 * @param orgId - Organization UUID
 * @param propertyId - Property UUID
 * @param filename - Unique filename
 * @returns Storage path string
 */
export function createStoragePath(
  orgId: string,
  propertyId: string,
  filename: string
): string {
  return `${orgId}/properties/${propertyId}/${filename}`;
}

/**
 * Create storage path for lot/unit image in Supabase Storage
 * @param orgId - Organization UUID
 * @param lotId - Lot/Unit UUID
 * @param filename - Unique filename
 * @returns Storage path string
 */
export function createLotStoragePath(
  orgId: string,
  lotId: string,
  filename: string
): string {
  return `${orgId}/lots/${lotId}/${filename}`;
}

/**
 * Check if file type is supported
 * @param mimeType - MIME type to check
 * @returns True if supported, false otherwise
 */
export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType);
}

/**
 * Get file extension from MIME type
 * @param mimeType - MIME type
 * @returns File extension (e.g., 'jpg', 'png', 'webp')
 */
export function getExtensionFromMimeType(mimeType: SupportedMimeType): string {
  const mimeToExt: Record<SupportedMimeType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return mimeToExt[mimeType] || 'jpg';
}

/**
 * Create a preview URL for a file (for display before upload)
 * @param file - File to create preview for
 * @returns Object URL string (must be revoked with URL.revokeObjectURL)
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke file preview URL to free memory
 * @param url - Object URL to revoke
 */
export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Validate multiple image files
 * @param files - Array of files to validate
 * @param options - Validation options
 * @returns Object with valid files and validation errors
 */
export async function validateImageFiles(
  files: File[],
  options: ImageUploadOptions = DEFAULT_IMAGE_OPTIONS
): Promise<{
  validFiles: File[];
  errors: Array<{ file: File; error: string }>;
}> {
  const validFiles: File[] = [];
  const errors: Array<{ file: File; error: string }> = [];

  // Check max count
  if (files.length > options.maxImages) {
    return {
      validFiles: [],
      errors: [
        {
          file: files[0],
          error: `Maximum ${options.maxImages} images allowed`,
        },
      ],
    };
  }

  // Validate each file
  for (const file of files) {
    const result = await validateImageFile(file, options);

    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push({ file, error: result.error || 'Validation failed' });
    }
  }

  return { validFiles, errors };
}
