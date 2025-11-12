'use client';

import { PropertyCard } from './property-card';
import { PropertyListItem } from './property-list-item';
import { PropertiesEmpty } from './properties-empty';
import type { PropertyWithLots } from '@/lib/actions/properties';

interface PropertiesListProps {
  properties: PropertyWithLots[];
  view?: 'grid' | 'list';
  hasFilters?: boolean;
  onClearSearch?: () => void;
}

export function PropertiesList({
  properties,
  view = 'grid',
  hasFilters = false,
  onClearSearch,
}: PropertiesListProps) {
  // Handle empty state
  if (properties.length === 0) {
    return (
      <PropertiesEmpty
        variant={hasFilters ? 'no-results' : 'no-properties'}
        onClearSearch={onClearSearch}
      />
    );
  }

  // Render list view
  if (view === 'list') {
    return (
      <div className="space-y-4" role="list" aria-label="Properties list">
        {properties.map((property) => (
          <div key={property.id} role="listitem">
            <PropertyListItem property={property} />
          </div>
        ))}
      </div>
    );
  }

  // Render grid view
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label="Properties grid"
    >
      {properties.map((property) => (
        <div key={property.id} role="listitem">
          <PropertyCard property={property} />
        </div>
      ))}
    </div>
  );
}
