'use client';

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { Amenity, AmenityCategory } from '@/types/amenity';

interface SelectedAmenity {
  amenity_id: string;
  quantity: number;
  notes?: string | null;
}

interface AmenitySelectorProps {
  selectedAmenities: string[];
  onChange: (amenityIds: string[]) => void;
  className?: string;
}

// Amenity categories with icons
const categoryLabels: Record<AmenityCategory, { label: string; icon: string }> = {
  essential: { label: 'Essential Amenities', icon: '⭐' },
  kitchen: { label: 'Kitchen', icon: '🍳' },
  bathroom: { label: 'Bathroom', icon: '🚿' },
  entertainment: { label: 'Entertainment', icon: '📺' },
  outdoor: { label: 'Outdoor', icon: '🌳' },
};

// Mock amenities data (replace with actual API call)
const mockAmenities: Amenity[] = [
  // Essential
  { id: '1', name: 'WiFi', category: 'essential', icon: '📶', created_at: '' },
  { id: '2', name: 'Heating', category: 'essential', icon: '🔥', created_at: '' },
  { id: '3', name: 'Air Conditioning', category: 'essential', icon: '❄️', created_at: '' },
  { id: '4', name: 'Parking', category: 'essential', icon: '🚗', created_at: '' },
  { id: '5', name: 'Smoke Detector', category: 'essential', icon: '🚨', created_at: '' },
  { id: '6', name: 'Fire Extinguisher', category: 'essential', icon: '🧯', created_at: '' },
  // Kitchen
  { id: '7', name: 'Refrigerator', category: 'kitchen', icon: '🧊', created_at: '' },
  { id: '8', name: 'Oven', category: 'kitchen', icon: '🔥', created_at: '' },
  { id: '9', name: 'Microwave', category: 'kitchen', icon: '📟', created_at: '' },
  { id: '10', name: 'Dishwasher', category: 'kitchen', icon: '🍽️', created_at: '' },
  { id: '11', name: 'Coffee Machine', category: 'kitchen', icon: '☕', created_at: '' },
  { id: '12', name: 'Kettle', category: 'kitchen', icon: '🫖', created_at: '' },
  // Bathroom
  { id: '13', name: 'Shower', category: 'bathroom', icon: '🚿', created_at: '' },
  { id: '14', name: 'Bathtub', category: 'bathroom', icon: '🛁', created_at: '' },
  { id: '15', name: 'Hairdryer', category: 'bathroom', icon: '💨', created_at: '' },
  { id: '16', name: 'Washer', category: 'bathroom', icon: '🧺', created_at: '' },
  { id: '17', name: 'Dryer', category: 'bathroom', icon: '🌀', created_at: '' },
  // Entertainment
  { id: '18', name: 'TV', category: 'entertainment', icon: '📺', created_at: '' },
  { id: '19', name: 'Streaming Services', category: 'entertainment', icon: '🎬', created_at: '' },
  { id: '20', name: 'Board Games', category: 'entertainment', icon: '🎲', created_at: '' },
  { id: '21', name: 'Books', category: 'entertainment', icon: '📚', created_at: '' },
  { id: '22', name: 'Workspace', category: 'entertainment', icon: '💻', created_at: '' },
  // Outdoor
  { id: '23', name: 'Balcony', category: 'outdoor', icon: '🏡', created_at: '' },
  { id: '24', name: 'Terrace', category: 'outdoor', icon: '🌅', created_at: '' },
  { id: '25', name: 'Garden', category: 'outdoor', icon: '🌻', created_at: '' },
  { id: '26', name: 'BBQ', category: 'outdoor', icon: '🍖', created_at: '' },
  { id: '27', name: 'Pool', category: 'outdoor', icon: '🏊', created_at: '' },
];

export function AmenitySelector({
  selectedAmenities,
  onChange,
  className,
}: AmenitySelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>(mockAmenities);
  const [expandedCategories, setExpandedCategories] = useState<Set<AmenityCategory>>(
    new Set(['essential'])
  );

  // Group amenities by category
  const amenitiesByCategory = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<AmenityCategory, Amenity[]>);

  // Toggle category expansion
  const toggleCategory = (category: AmenityCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Toggle amenity selection
  const toggleAmenity = (amenityId: string) => {
    const isSelected = selectedAmenities.includes(amenityId);
    if (isSelected) {
      onChange(selectedAmenities.filter((id) => id !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  // Count selected amenities per category
  const getSelectedCount = (category: AmenityCategory) => {
    const categoryAmenityIds = amenitiesByCategory[category]?.map((a) => a.id) || [];
    return selectedAmenities.filter((id) => categoryAmenityIds.includes(id)).length;
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="text-sm text-gray-600 mb-4">
        Select the amenities available in this lot. Selected: {selectedAmenities.length}
      </div>

      {Object.entries(categoryLabels).map(([category, { label, icon }]) => {
        const categoryAmenities = amenitiesByCategory[category as AmenityCategory] || [];
        const isExpanded = expandedCategories.has(category as AmenityCategory);
        const selectedCount = getSelectedCount(category as AmenityCategory);

        return (
          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category as AmenityCategory)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`category-${category}`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{icon}</span>
                <span className="font-medium text-gray-anthracite">{label}</span>
                {selectedCount > 0 && (
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                    {selectedCount} selected
                  </span>
                )}
              </div>
              <svg
                className={clsx('w-5 h-5 text-gray-500 transition-transform', {
                  'transform rotate-180': isExpanded,
                })}
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

            {/* Category Amenities */}
            {isExpanded && (
              <div
                id={`category-${category}`}
                className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {categoryAmenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.id);
                  return (
                    <label
                      key={amenity.id}
                      className={clsx(
                        'flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50',
                        {
                          'border-primary bg-primary/5': isSelected,
                          'border-gray-200': !isSelected,
                        }
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                      />
                      <span className="text-xl">{amenity.icon || '✓'}</span>
                      <span className="text-sm font-medium text-gray-anthracite">
                        {amenity.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
