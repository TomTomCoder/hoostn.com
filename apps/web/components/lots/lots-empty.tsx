'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LotsEmptyProps {
  propertyId: string;
}

export function LotsEmpty({ propertyId }: LotsEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-primary/40"
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

      <h3 className="text-xl font-bold text-gray-anthracite mb-2">
        No lots yet
      </h3>

      <p className="text-gray-600 text-center max-w-md mb-8">
        Create your first lot to start managing bookable units for this property.
        Each lot represents a rental unit with its own pricing and amenities.
      </p>

      <Link href={`/dashboard/properties/${propertyId}/lots/new`}>
        <Button variant="primary" size="lg">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Your First Lot
        </Button>
      </Link>
    </div>
  );
}
