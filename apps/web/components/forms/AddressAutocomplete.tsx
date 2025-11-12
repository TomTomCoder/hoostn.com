'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, MapPin, X } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (address: AddressResult) => void;
  country?: string;
  placeholder?: string;
  className?: string;
}

export interface AddressResult {
  fullAddress: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
  properties?: {
    address?: string;
  };
  text?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  country = 'us',
  placeholder = 'Search for an address...',
  className = '',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from Mapbox Geocoding API
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      if (!mapboxToken) {
        setError('Mapbox token not configured');
        console.error('NEXT_PUBLIC_MAPBOX_TOKEN is not set');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          access_token: mapboxToken,
          country: country,
          types: 'address,place',
          limit: '5',
          autocomplete: 'true',
        });

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?${params}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data.features || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Failed to fetch address suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [country]
  );

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Parse Mapbox feature to AddressResult
  const parseFeature = (feature: MapboxFeature): AddressResult => {
    const [longitude, latitude] = feature.center;

    // Extract address components from context
    let city = '';
    let state = '';
    let postalCode = '';
    let countryName = '';

    feature.context?.forEach((item) => {
      if (item.id.startsWith('place')) {
        city = item.text;
      } else if (item.id.startsWith('region')) {
        state = item.text;
      } else if (item.id.startsWith('postcode')) {
        postalCode = item.text;
      } else if (item.id.startsWith('country')) {
        countryName = item.text;
      }
    });

    return {
      fullAddress: feature.place_name,
      streetAddress: feature.text,
      city,
      state,
      postalCode,
      country: countryName,
      latitude,
      longitude,
    };
  };

  // Handle suggestion selection
  const handleSelect = useCallback(
    (feature: MapboxFeature) => {
      const addressResult = parseFeature(feature);
      onChange(addressResult.fullAddress);
      onSelectAddress(addressResult);
      setIsOpen(false);
      setSuggestions([]);
    },
    [onChange, onSelectAddress]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleSelect]
  );

  // Clear input
  const handleClear = useCallback(() => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-300' : ''}
          `}
          aria-label="Address search"
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-expanded={isOpen}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : value ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Clear input"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="address-suggestions"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full text-left px-4 py-3 flex items-start gap-3
                hover:bg-gray-50 transition-colors
                ${selectedIndex === index ? 'bg-blue-50' : ''}
                ${index > 0 ? 'border-t border-gray-100' : ''}
              `}
              role="option"
              aria-selected={selectedIndex === index}
              type="button"
            >
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.text}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.place_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !loading && value.trim() && suggestions.length === 0 && (
        <div
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4"
          role="status"
        >
          <p className="text-sm text-gray-500 text-center">
            No addresses found. Try a different search.
          </p>
        </div>
      )}
    </div>
  );
}
