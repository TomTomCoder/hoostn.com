'use client';

import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import type { PropertyWithLots } from '@/lib/actions/properties';

interface PropertyListItemProps {
  property: PropertyWithLots;
}

export function PropertyListItem({ property }: PropertyListItemProps) {
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

  // Truncate description to 150 characters for list view
  const truncatedDescription = property.description
    ? property.description.length > 150
      ? `${property.description.substring(0, 150)}...`
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
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Property Image */}
        <div className="relative w-full sm:w-48 h-48 sm:h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
            <svg
              className="w-12 h-12 text-primary/30"
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
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-anthracite">
              {lotCount} {lotCount === 1 ? 'unit' : 'units'}
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-anthracite group-hover:text-primary transition-colors line-clamp-1">
              {property.name}
            </h3>
          </div>

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
              {property.address}, {property.city}
              {property.country && property.country !== 'FR'
                ? `, ${property.country}`
                : ''}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {truncatedDescription}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {lotCount > 0 && (
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
            )}
            {property.postal_code && (
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>{property.postal_code}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
