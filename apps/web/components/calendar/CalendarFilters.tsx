/**
 * CalendarFilters Component
 * Filter controls for calendar (properties, lots, status)
 */

'use client';

import { useState } from 'react';
import type { PropertyWithLots } from '@/types/calendar';
import type { ReservationStatus } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CalendarFiltersProps {
  properties: PropertyWithLots[];
  selectedPropertyIds: string[];
  selectedLotIds: string[];
  selectedStatuses: ReservationStatus[];
  showBlocked: boolean;
  onPropertyToggle: (propertyId: string) => void;
  onLotToggle: (lotId: string) => void;
  onStatusToggle: (status: ReservationStatus) => void;
  onShowBlockedToggle: () => void;
  onReset: () => void;
}

const STATUS_OPTIONS: ReservationStatus[] = [
  'pending',
  'confirmed',
  'checked_in',
  'checked_out',
];

export function CalendarFilters({
  properties,
  selectedPropertyIds,
  selectedLotIds,
  selectedStatuses,
  showBlocked,
  onPropertyToggle,
  onLotToggle,
  onStatusToggle,
  onShowBlockedToggle,
  onReset,
}: CalendarFiltersProps) {
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [showLotDropdown, setShowLotDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const hasActiveFilters =
    selectedPropertyIds.length > 0 ||
    selectedLotIds.length > 0 ||
    selectedStatuses.length > 0 ||
    !showBlocked;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Properties Filter */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
          >
            <span>Properties</span>
            {selectedPropertyIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedPropertyIds.length}
              </Badge>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPropertyDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {properties.map((property) => (
                <label
                  key={property.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPropertyIds.includes(property.id)}
                    onChange={() => onPropertyToggle(property.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{property.name}</span>
                </label>
              ))}
              {properties.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No properties found</div>
              )}
            </div>
          )}
        </div>

        {/* Lots Filter */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            onClick={() => setShowLotDropdown(!showLotDropdown)}
          >
            <span>Lots</span>
            {selectedLotIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedLotIds.length}
              </Badge>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLotDropdown && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {properties.map((property) => (
                <div key={property.id}>
                  <div className="px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700">
                    {property.name}
                  </div>
                  {property.lots.map((lot) => (
                    <label
                      key={lot.id}
                      className="flex items-center gap-2 px-3 py-2 pl-6 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLotIds.includes(lot.id)}
                        onChange={() => onLotToggle(lot.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{lot.title}</span>
                      {lot.status !== 'active' && (
                        <Badge variant="secondary" className="text-xs">
                          {lot.status}
                        </Badge>
                      )}
                    </label>
                  ))}
                  {property.lots.length === 0 && (
                    <div className="px-3 py-2 pl-6 text-sm text-gray-500">No lots</div>
                  )}
                </div>
              ))}
              {properties.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No properties found</div>
              )}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span>Status</span>
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedStatuses.length}
              </Badge>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => onStatusToggle(status)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Show Blocked Toggle */}
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={showBlocked}
            onChange={onShowBlockedToggle}
            className="rounded border-gray-300"
          />
          <span>Show blocked dates</span>
        </label>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset Filters
          </Button>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showPropertyDropdown || showLotDropdown || showStatusDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowPropertyDropdown(false);
            setShowLotDropdown(false);
            setShowStatusDropdown(false);
          }}
        />
      )}
    </div>
  );
}
