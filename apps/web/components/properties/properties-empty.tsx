'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PropertiesEmptyProps {
  variant?: 'no-properties' | 'no-results';
  onClearSearch?: () => void;
}

export function PropertiesEmpty({
  variant = 'no-properties',
  onClearSearch,
}: PropertiesEmptyProps) {
  const router = useRouter();

  if (variant === 'no-results') {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-anthracite mb-2">
          No properties found
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We couldn't find any properties matching your search criteria. Try
          adjusting your filters or search terms.
        </p>
        {onClearSearch && (
          <Button
            variant="outline"
            size="md"
            onClick={onClearSearch}
            aria-label="Clear search filters"
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-primary"
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
      </div>
      <h3 className="text-xl font-bold text-gray-anthracite mb-2">
        No properties yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Get started by adding your first rental property. You'll be able to
        manage units, reservations, and more.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => router.push('/dashboard/properties/new')}
        aria-label="Add your first property"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Add your first property
      </Button>
    </div>
  );
}
