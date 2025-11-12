'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Star, Eye, Trash2, Loader2 } from 'lucide-react';
import { deletePropertyImage, setPrimaryImage } from '@/lib/actions/image-upload';
import type { PropertyImage } from '@/types/image';

interface ImageGalleryProps {
  images: PropertyImage[];
  onUpdate?: () => void;
}

export function ImageGallery({ images, onUpdate }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  const currentImage = images[currentImageIndex];

  const openLightbox = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleDelete = useCallback(
    async (imageId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!confirm('Are you sure you want to delete this image?')) {
        return;
      }

      setDeletingId(imageId);
      try {
        const result = await deletePropertyImage(imageId);
        if (result.success) {
          onUpdate?.();
        } else {
          alert(result.error || 'Failed to delete image');
        }
      } catch (error) {
        alert('Failed to delete image');
      } finally {
        setDeletingId(null);
      }
    },
    [onUpdate]
  );

  const handleSetPrimary = useCallback(
    async (imageId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      setSettingPrimaryId(imageId);
      try {
        const result = await setPrimaryImage(imageId);
        if (result.success) {
          onUpdate?.();
        } else {
          alert(result.error || 'Failed to set primary image');
        }
      } catch (error) {
        alert('Failed to set primary image');
      } finally {
        setSettingPrimaryId(null);
      }
    },
    [onUpdate]
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length, closeLightbox]);

  if (images.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
            onClick={() => openLightbox(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(index);
              }
            }}
            aria-label={`View image ${index + 1}`}
          >
            {/* Image */}
            <img
              src={image.url}
              alt={image.altText || `Property image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Primary Badge */}
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Primary
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {/* View Full */}
              <button
                onClick={() => openLightbox(index)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                aria-label="View full size"
              >
                <Eye className="h-5 w-5 text-gray-700" />
              </button>

              {/* Set Primary */}
              {!image.isPrimary && (
                <button
                  onClick={(e) => handleSetPrimary(image.id, e)}
                  disabled={settingPrimaryId === image.id}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                  aria-label="Set as primary image"
                >
                  {settingPrimaryId === image.id ? (
                    <Loader2 className="h-5 w-5 text-gray-700 animate-spin" />
                  ) : (
                    <Star className="h-5 w-5 text-gray-700" />
                  )}
                </button>
              )}

              {/* Delete */}
              <button
                onClick={(e) => handleDelete(image.id, e)}
                disabled={deletingId === image.id}
                className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                aria-label="Delete image"
              >
                {deletingId === image.id ? (
                  <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5 text-red-600" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-white bg-opacity-10 rounded-md text-white text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) =>
                    prev > 0 ? prev - 1 : images.length - 1
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
                aria-label="Previous image"
              >
                <span className="text-white text-2xl">‹</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) =>
                    prev < images.length - 1 ? prev + 1 : 0
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors"
                aria-label="Next image"
              >
                <span className="text-white text-2xl">›</span>
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.url}
              alt={currentImage.altText || `Property image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />

            {/* Image Info */}
            <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {currentImage.fileName || `Image ${currentImageIndex + 1}`}
                  </p>
                  {currentImage.width && currentImage.height && (
                    <p className="text-sm text-gray-300">
                      {currentImage.width} × {currentImage.height} pixels
                    </p>
                  )}
                </div>
                {currentImage.isPrimary && (
                  <div className="flex items-center gap-1 bg-yellow-500 px-2 py-1 rounded text-xs font-medium">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
