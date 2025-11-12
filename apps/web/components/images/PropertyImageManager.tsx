'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageGallery } from './ImageGallery';
import { getPropertyImages } from '@/lib/actions/image-upload';
import type { PropertyImage } from '@/types/image';
import { Loader2 } from 'lucide-react';

interface PropertyImageManagerProps {
  propertyId: string;
}

export function PropertyImageManager({ propertyId }: PropertyImageManagerProps) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPropertyImages(propertyId);

      if (result.success && result.images) {
        setImages(result.images);
      } else {
        setError(result.error || 'Failed to load images');
      }
    } catch (err) {
      setError('Failed to load images');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleUploadComplete = useCallback(() => {
    // Reload images after successful upload
    loadImages();
  }, [loadImages]);

  const handleUpdate = useCallback(() => {
    // Reload images after any update (delete, set primary)
    loadImages();
  }, [loadImages]);

  return (
    <div className="space-y-8">
      {/* Upload Images Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Images</h2>
        <ImageUploader
          propertyId={propertyId}
          onUploadComplete={handleUploadComplete}
          maxFiles={10}
        />
      </div>

      {/* Property Images Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Property Images</h2>
          {images.length > 0 && (
            <span className="text-sm text-gray-500">{images.length} images</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 border border-gray-200 rounded-lg">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 border border-red-200 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadImages}
              className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <ImageGallery images={images} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
}
