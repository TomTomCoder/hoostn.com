'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { AmenityFilterOption } from '@/types/search';

interface SearchFormProps {
  availableCities?: string[];
  availableAmenities?: AmenityFilterOption[];
  priceRange?: { min: number; max: number };
  onSearch?: () => void;
}

export function SearchForm({
  availableCities = [],
  availableAmenities = [],
  priceRange = { min: 0, max: 1000 },
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '1');
  const [minPrice, setMinPrice] = useState(
    searchParams.get('minPrice') || String(priceRange.min)
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get('maxPrice') || String(priceRange.max)
  );
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [bathrooms, setBathrooms] = useState(
    searchParams.get('bathrooms') || ''
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [petsAllowed, setPetsAllowed] = useState(
    searchParams.get('petsAllowed') === 'true'
  );
  const [showFilters, setShowFilters] = useState(false);

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  // Handle amenity toggle
  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build query params
    const params = new URLSearchParams();

    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests && guests !== '1') params.set('guests', guests);
    if (minPrice && minPrice !== String(priceRange.min))
      params.set('minPrice', minPrice);
    if (maxPrice && maxPrice !== String(priceRange.max))
      params.set('maxPrice', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (bathrooms) params.set('bathrooms', bathrooms);
    if (selectedAmenities.length > 0)
      params.set('amenities', selectedAmenities.join(','));
    if (petsAllowed) params.set('petsAllowed', 'true');

    // Navigate to search page with params
    router.push(`/search?${params.toString()}`);
  };

  // Reset form
  const handleReset = () => {
    setCity('');
    setCheckIn('');
    setCheckOut('');
    setGuests('1');
    setMinPrice(String(priceRange.min));
    setMaxPrice(String(priceRange.max));
    setBedrooms('');
    setBathrooms('');
    setSelectedAmenities([]);
    setPetsAllowed(false);
    router.push('/search');
  };

  // Group amenities by category
  const amenitiesByCategory = availableAmenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, AmenityFilterOption[]>);

  const categoryLabels = {
    essential: 'Essential',
    kitchen: 'Kitchen',
    bathroom: 'Bathroom',
    entertainment: 'Entertainment',
    outdoor: 'Outdoor',
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
      <div className="space-y-4">
        {/* Main Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              list="cities"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {availableCities.length > 0 && (
              <datalist id="cities">
                {availableCities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            )}
          </div>

          {/* Check-in */}
          <div>
            <label
              htmlFor="checkIn"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Check-in
            </label>
            <input
              type="date"
              id="checkIn"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={today}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Check-out */}
          <div>
            <label
              htmlFor="checkOut"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Check-out
            </label>
            <input
              type="date"
              id="checkOut"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || today}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Guests */}
          <div>
            <label
              htmlFor="guests"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Guests
            </label>
            <input
              type="number"
              id="guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              min="1"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Toggle Filters Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="text-primary hover:text-primary-dark font-medium text-sm flex items-center gap-2"
          >
            {showFilters ? '− Hide' : '+ More'} Filters
          </button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t space-y-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (per night)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minPrice" className="text-xs text-gray-600">
                    Min
                  </label>
                  <input
                    type="number"
                    id="minPrice"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="text-xs text-gray-600">
                    Max
                  </label>
                  <input
                    type="number"
                    id="maxPrice"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="bedrooms"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bedrooms (min)
                </label>
                <select
                  id="bedrooms"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}+
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="bathrooms"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bathrooms (min)
                </label>
                <select
                  id="bathrooms"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Any</option>
                  {[1, 2, 3, 4].map((num) => (
                    <option key={num} value={num}>
                      {num}+
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pets Allowed */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  Pets Allowed
                </span>
              </label>
            </div>

            {/* Amenities */}
            {Object.keys(amenitiesByCategory).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenities
                </label>
                <div className="space-y-4">
                  {Object.entries(amenitiesByCategory).map(
                    ([category, amenities]) => (
                      <div key={category}>
                        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          {
                            categoryLabels[
                              category as keyof typeof categoryLabels
                            ]
                          }
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {amenities.map((amenity) => (
                            <label
                              key={amenity.id}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAmenities.includes(amenity.id)}
                                onChange={() => toggleAmenity(amenity.id)}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <span className="text-gray-700">
                                {amenity.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
