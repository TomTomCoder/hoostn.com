'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LotImage {
  id: string;
  storage_path: string;
  filename: string;
  display_order: number;
  is_primary: boolean;
}

interface PublicLotGalleryProps {
  images: LotImage[];
  lotTitle: string;
}

export function PublicLotGallery({ images, lotTitle }: PublicLotGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sort images by display order
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  // Get hero image (primary or first image)
  const heroImage = sortedImages.find((img) => img.is_primary) || sortedImages[0];
  const gridImages = sortedImages.filter((img) => img.id !== heroImage?.id).slice(0, 4);

  const openLightbox = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
    },
    [sortedImages.length]
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
    },
    [sortedImages.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) =>
          prev > 0 ? prev - 1 : sortedImages.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) =>
          prev < sortedImages.length - 1 ? prev + 1 : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, sortedImages.length, closeLightbox]);

  if (!heroImage) {
    return (
      <div className="w-full aspect-[21/9] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  const getImageUrl = (storagePath: string) => {
    // Construct full Supabase storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/lot-images/${storagePath}`;
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden">
        {/* Hero Image - Takes up 2 columns and 2 rows */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group bg-gray-100"
          onClick={() => openLightbox(0)}
        >
          <img
            src={getImageUrl(heroImage.storage_path)}
            alt={lotTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>

        {/* Grid Images */}
        {gridImages.map((image, index) => (
          <div
            key={image.id}
            className="relative cursor-pointer group bg-gray-100 aspect-square"
            onClick={() => openLightbox(index + 1)}
          >
            <img
              src={getImageUrl(image.storage_path)}
              alt={`${lotTitle} - Image ${index + 2}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
        ))}

        {/* "Show all photos" button overlay on last image */}
        {sortedImages.length > 5 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Show all {sortedImages.length} photos
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && sortedImages[currentImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors z-10"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 px-3 py-2 bg-white bg-opacity-10 rounded-lg text-white text-sm font-medium z-10">
            {currentImageIndex + 1} / {sortedImages.length}
          </div>

          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(sortedImages[currentImageIndex].storage_path)}
              alt={`${lotTitle} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white text-sm text-center">
                {sortedImages[currentImageIndex].filename}
              </p>
            </div>
          </div>

          {/* Thumbnail Strip (optional, for easier navigation) */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentImageIndex
                    ? 'border-white opacity-100 scale-110'
                    : 'border-transparent opacity-50 hover:opacity-75'
                }`}
              >
                <img
                  src={getImageUrl(image.storage_path)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
