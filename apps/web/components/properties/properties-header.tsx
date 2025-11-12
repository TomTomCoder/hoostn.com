'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PropertiesHeaderProps {
  propertyCount: number;
  cities?: string[];
}

export function PropertiesHeader({
  propertyCount,
  cities = [],
}: PropertiesHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [view, setView] = useState<'grid' | 'list'>(
    (searchParams.get('view') as 'grid' | 'list') || 'grid'
  );
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get('city') || ''
  );
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL({ search: searchQuery });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const updateURL = useCallback(
    (params: { search?: string; view?: string; city?: string }) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      // Update or remove search param
      if (params.search !== undefined) {
        if (params.search) {
          newSearchParams.set('search', params.search);
        } else {
          newSearchParams.delete('search');
        }
      }

      // Update or remove view param
      if (params.view !== undefined) {
        if (params.view && params.view !== 'grid') {
          newSearchParams.set('view', params.view);
        } else {
          newSearchParams.delete('view');
        }
      }

      // Update or remove city param
      if (params.city !== undefined) {
        if (params.city) {
          newSearchParams.set('city', params.city);
        } else {
          newSearchParams.delete('city');
        }
      }

      const newURL = `${window.location.pathname}?${newSearchParams.toString()}`;
      router.push(newURL);
    },
    [router, searchParams]
  );

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView);
    updateURL({ view: newView });
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    updateURL({ city });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    router.push('/dashboard/properties');
  };

  const hasActiveFilters = searchQuery || selectedCity;

  return (
    <div className="mb-6 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-anthracite">
            Properties
          </h1>
          <p className="text-gray-600 mt-1">
            {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/dashboard/properties/new')}
            aria-label="Add new property"
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
            Add Property
          </Button>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            aria-label="Search properties"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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

        {/* Filter Button (Mobile) */}
        {cities.length > 0 && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
            aria-label="Toggle filters"
            aria-expanded={showFilters}
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </Button>
        )}

        {/* City Filter Dropdown (Desktop) */}
        {cities.length > 0 && (
          <div className="hidden sm:block">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              aria-label="Filter by city"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Toggle */}
        <div
          className="flex items-center border border-gray-300 rounded-lg overflow-hidden"
          role="group"
          aria-label="View options"
        >
          <button
            onClick={() => handleViewChange('grid')}
            className={`px-4 py-2 transition-colors ${
              view === 'grid'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-anthracite hover:bg-gray-50'
            }`}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className={`px-4 py-2 transition-colors ${
              view === 'list'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-anthracite hover:bg-gray-50'
            }`}
            aria-label="List view"
            aria-pressed={view === 'list'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Filters */}
      {showFilters && cities.length > 0 && (
        <div className="sm:hidden p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label
              htmlFor="city-filter-mobile"
              className="block text-sm font-medium text-gray-anthracite mb-2"
            >
              Filter by city
            </label>
            <select
              id="city-filter-mobile"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
              Search: {searchQuery}
            </span>
          )}
          {selectedCity && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
              City: {selectedCity}
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary hover:text-primary-dark font-medium"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
