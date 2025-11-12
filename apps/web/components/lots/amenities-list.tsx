'use client';

import { useState } from 'react';

interface Amenity {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

interface LotAmenity {
  amenity: Amenity;
  quantity: number;
  notes?: string | null;
}

interface AmenitiesListProps {
  lotAmenities: LotAmenity[];
  expandedByDefault?: boolean;
}

// Icon mapping for common amenities
const getAmenityIcon = (name: string, category: string) => {
  const lowerName = name.toLowerCase();

  // WiFi
  if (lowerName.includes('wifi') || lowerName.includes('internet')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    );
  }

  // Parking
  if (lowerName.includes('parking')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    );
  }

  // TV/Entertainment
  if (lowerName.includes('tv') || lowerName.includes('streaming')) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }

  // Kitchen appliances
  if (category === 'kitchen') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    );
  }

  // Outdoor
  if (category === 'outdoor') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    );
  }

  // Default icon
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
};

const categoryLabels: Record<string, string> = {
  essential: 'Essential',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  entertainment: 'Entertainment',
  outdoor: 'Outdoor',
};

export function AmenitiesList({
  lotAmenities,
  expandedByDefault = true,
}: AmenitiesListProps) {
  // Group amenities by category
  const groupedAmenities = lotAmenities.reduce((acc, lotAmenity) => {
    const category = lotAmenity.amenity.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(lotAmenity);
    return acc;
  }, {} as Record<string, LotAmenity[]>);

  const categories = Object.keys(groupedAmenities).sort();

  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(expandedByDefault ? categories : [])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (lotAmenities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No amenities configured for this lot.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category);
        const amenities = groupedAmenities[category];
        const label = categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);

        return (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center">
                <span className="font-semibold text-gray-anthracite">
                  {label}
                </span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-white rounded-full text-gray-600">
                  {amenities.length}
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isExpanded ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Amenities List */}
            {isExpanded && (
              <div className="px-4 py-3 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {amenities.map((lotAmenity) => (
                    <div
                      key={lotAmenity.amenity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0 text-accent mt-0.5">
                        {getAmenityIcon(lotAmenity.amenity.name, category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline">
                          <span className="text-gray-anthracite">
                            {lotAmenity.amenity.name}
                          </span>
                          {lotAmenity.quantity > 1 && (
                            <span className="ml-1 text-sm text-gray-500">
                              (×{lotAmenity.quantity})
                            </span>
                          )}
                        </div>
                        {lotAmenity.notes && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {lotAmenity.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
