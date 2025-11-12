'use client';

import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import type { PropertyWithLots } from '@/lib/actions/properties';

interface PropertyCardProps {
  property: PropertyWithLots;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const lotCount = property.lots?.length || 0;

  const handleClick = () => {
    router.push(`/dashboard/properties/${property.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Truncate description to 100 characters
  const truncatedDescription = property.description
    ? property.description.length > 100
      ? `${property.description.substring(0, 100)}...`
      : property.description
    : 'No description available';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${property.name}`}
    >
      {/* Property Image */}
      <div className="relative w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
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
        {/* Lot count badge */}
        {lotCount > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-anthracite">
            {lotCount} {lotCount === 1 ? 'unit' : 'units'}
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-anthracite group-hover:text-primary transition-colors line-clamp-1">
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="line-clamp-1">
            {property.city}
            {property.country && property.country !== 'FR'
              ? `, ${property.country}`
              : ''}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
          {truncatedDescription}
        </p>

        {/* Stats */}
        {lotCount > 0 && (
          <div className="flex items-center gap-4 pt-2 text-sm text-gray-600 border-t border-gray-100">
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
              <span>{lotCount} units</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
