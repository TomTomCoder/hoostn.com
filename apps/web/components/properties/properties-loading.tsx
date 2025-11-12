'use client';

import { Card } from '@/components/ui/card';

interface PropertiesLoadingProps {
  view?: 'grid' | 'list';
  count?: number;
}

export function PropertiesLoading({
  view = 'grid',
  count = 6,
}: PropertiesLoadingProps) {
  if (view === 'list') {
    return (
      <div className="space-y-4" role="status" aria-label="Loading properties">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Image skeleton */}
              <div className="w-full sm:w-48 h-48 sm:h-32 bg-gray-200 rounded-lg flex-shrink-0" />

              {/* Content skeleton */}
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                </div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          </Card>
        ))}
        <span className="sr-only">Loading properties...</span>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-label="Loading properties"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          {/* Image skeleton */}
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />

          {/* Content skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
            <div className="flex gap-4 pt-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </Card>
      ))}
      <span className="sr-only">Loading properties...</span>
    </div>
  );
}
