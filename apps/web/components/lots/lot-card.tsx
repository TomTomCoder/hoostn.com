'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LotImage {
  id: string;
  storage_path: string;
  is_primary: boolean;
}

interface Lot {
  id: string;
  property_id: string;
  title: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price?: number | null;
  status?: string;
  lot_images?: LotImage[];
}

interface LotCardProps {
  lot: Lot;
  propertyName?: string;
  onDelete?: (lotId: string) => void;
}

export function LotCard({ lot, propertyName, onDelete }: LotCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push(`/dashboard/properties/${lot.property_id}/lots/${lot.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/properties/${lot.property_id}/lots/${lot.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(lot.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Get primary image or first image
  const primaryImage = lot.lot_images?.find(img => img.is_primary) || lot.lot_images?.[0];

  // Truncate description
  const truncatedDescription = lot.description
    ? lot.description.length > 100
      ? `${lot.description.substring(0, 100)}...`
      : lot.description
    : 'No description available';

  // Status badge color
  const statusColor =
    lot.status === 'active'
      ? 'bg-accent/10 text-accent'
      : lot.status === 'maintenance'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-200 text-gray-600';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 group relative"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${lot.title}`}
    >
      {/* Lot Image */}
      <div className="relative w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
        {primaryImage ? (
          <img
            src={`/api/images/${primaryImage.storage_path}`}
            alt={lot.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
            <svg
              className="w-16 h-16 text-primary/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        {lot.status && (
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor} bg-white/90 backdrop-blur-sm`}
            >
              {lot.status}
            </span>
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Edit lot"
            >
              <svg
                className="w-5 h-5 text-gray-anthracite"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                aria-label="Delete lot"
              >
                <svg
                  className="w-5 h-5 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lot Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-anthracite group-hover:text-primary transition-colors line-clamp-1">
          {lot.title}
        </h3>

        {/* Property Name Breadcrumb */}
        {propertyName && (
          <div className="flex items-center text-sm text-gray-500">
            <svg
              className="w-4 h-4 mr-1 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="line-clamp-1">{propertyName}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
          {truncatedDescription}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {lot.bedrooms > 0 && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>{lot.bedrooms} bed{lot.bedrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          {lot.bathrooms > 0 && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
              <span>{lot.bathrooms} bath{lot.bathrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{lot.max_guests} guest{lot.max_guests !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Price */}
        {lot.base_price && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center text-primary font-bold">
              <span className="text-2xl">€{lot.base_price}</span>
              <span className="text-sm text-gray-500 ml-1">/night</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
