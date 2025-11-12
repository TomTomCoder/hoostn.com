/**
 * Image Types for Property Management
 * Defines types for image uploads, progress tracking, and image metadata
 */

/**
 * Supported MIME types for image uploads
 */
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/**
 * Image upload progress tracking
 */
export interface ImageUploadProgress {
  /** Unique identifier for the upload */
  id: string;
  /** File being uploaded */
  file: File;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Upload status */
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  /** Error message if status is 'error' */
  error?: string;
  /** URL of uploaded image (when completed) */
  url?: string;
  /** ID of the image record in database (when completed) */
  imageId?: string;
}

/**
 * Property image metadata from database
 */
export interface PropertyImage {
  /** UUID of the image record */
  id: string;
  /** UUID of the property this image belongs to */
  property_id: string;
  /** UUID of the organization */
  org_id: string;
  /** Path in Supabase Storage */
  storage_path: string;
  /** Original filename */
  file_name: string;
  /** File size in bytes */
  file_size: number;
  /** MIME type */
  mime_type: SupportedMimeType;
  /** Image width in pixels */
  width: number | null;
  /** Image height in pixels */
  height: number | null;
  /** Display order (lower numbers first) */
  display_order: number;
  /** Whether this is the primary/hero image */
  is_primary: boolean;
  /** Alt text for accessibility */
  alt_text: string | null;
  /** Timestamp when created */
  created_at: string;
  /** Timestamp when last updated */
  updated_at: string;
}

/**
 * Lot/unit image metadata from database
 */
export interface LotImage {
  /** UUID of the image record */
  id: string;
  /** UUID of the lot/unit this image belongs to */
  lot_id: string;
  /** UUID of the organization */
  org_id: string;
  /** Path in Supabase Storage */
  storage_path: string;
  /** Original filename */
  file_name: string;
  /** File size in bytes */
  file_size: number;
  /** MIME type */
  mime_type: SupportedMimeType;
  /** Image width in pixels */
  width: number | null;
  /** Image height in pixels */
  height: number | null;
  /** Display order (lower numbers first) */
  display_order: number;
  /** Whether this is the primary/hero image */
  is_primary: boolean;
  /** Alt text for accessibility */
  alt_text: string | null;
  /** Timestamp when created */
  created_at: string;
  /** Timestamp when last updated */
  updated_at: string;
}

/**
 * Image upload options and constraints
 */
export interface ImageUploadOptions {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Maximum number of images allowed */
  maxImages: number;
  /** Allowed MIME types */
  allowedMimeTypes: readonly string[];
  /** Minimum image width in pixels */
  minWidth?: number;
  /** Minimum image height in pixels */
  minHeight?: number;
  /** Maximum image width in pixels */
  maxWidth?: number;
  /** Maximum image height in pixels */
  maxHeight?: number;
  /** Generate thumbnail */
  generateThumbnail?: boolean;
  /** Thumbnail max width */
  thumbnailMaxWidth?: number;
  /** Thumbnail max height */
  thumbnailMaxHeight?: number;
}

/**
 * Default image upload options
 */
export const DEFAULT_IMAGE_OPTIONS: ImageUploadOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxImages: 10,
  allowedMimeTypes: SUPPORTED_MIME_TYPES,
  minWidth: 800,
  minHeight: 600,
  generateThumbnail: true,
  thumbnailMaxWidth: 400,
  thumbnailMaxHeight: 300,
};

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: ImageDimensions;
}

/**
 * Image file with preview
 */
export interface ImageFileWithPreview extends File {
  preview?: string;
}
