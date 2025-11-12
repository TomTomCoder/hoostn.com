/**
 * CalendarContainer Component
 * Main client component that orchestrates the calendar functionality
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarFilters } from './CalendarFilters';
import { CalendarStats } from './CalendarStats';
import { MonthView } from './MonthView';
import { BulkBlockModal } from './BulkBlockModal';
import { Button } from '@/components/ui/button';
import type { PropertyWithLots, CalendarEvent, CalendarMetrics } from '@/types/calendar';
import { getCalendarEvents, getCalendarMetrics } from '@/lib/actions/calendar';
import { getExpandedDateRange } from '@/lib/utils/calendar-utils';

interface CalendarContainerProps {
  initialProperties: PropertyWithLots[];
}

export function CalendarContainer({ initialProperties }: CalendarContainerProps) {
  const {
    currentView,
    currentDate,
    selectedPropertyIds,
    selectedLotIds,
    selectedStatuses,
    showBlocked,
    events,
    isLoading,
    setView,
    nextPeriod,
    previousPeriod,
    goToToday,
    togglePropertySelection,
    toggleLotSelection,
    toggleStatusFilter,
    toggleShowBlocked,
    resetFilters,
    setEvents,
    setLoading,
    getFilters,
  } = useCalendarStore();

  const [metrics, setMetrics] = useState<CalendarMetrics[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [bulkBlockModalOpen, setBulkBlockModalOpen] = useState(false);

  // Fetch calendar events when filters or date changes
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const filters = getFilters();
    const dateRange = getExpandedDateRange(currentDate, currentView);

    const result = await getCalendarEvents(filters, dateRange);

    if (result.success) {
      setEvents(result.data);
    } else {
      console.error('Failed to fetch events:', result.error);
      setEvents([]);
    }

    setLoading(false);
  }, [currentDate, currentView, getFilters, setEvents, setLoading]);

  // Fetch metrics when filters change
  const fetchMetrics = useCallback(async () => {
    const filters = getFilters();
    const lotIds = filters.lotIds;

    if (lotIds.length === 0) {
      setMetrics([]);
      return;
    }

    setMetricsLoading(true);
    const dateRange = getExpandedDateRange(currentDate, currentView);

    const result = await getCalendarMetrics(lotIds, dateRange);

    if (result.success) {
      setMetrics(result.data);
    } else {
      console.error('Failed to fetch metrics:', result.error);
      setMetrics([]);
    }

    setMetricsLoading(false);
  }, [currentDate, currentView, getFilters]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Get selected properties for display
  const selectedProperties = initialProperties
    .filter((p) =>
      selectedPropertyIds.length === 0 ? true : selectedPropertyIds.includes(p.id)
    )
    .map((property) => ({
      ...property,
      lots: property.lots.filter((lot) =>
        selectedLotIds.length === 0 ? true : selectedLotIds.includes(lot.id)
      ),
    }))
    .filter((property) => property.lots.length > 0);

  const handleEventClick = (event: CalendarEvent) => {
    // TODO: Open event details modal or navigate to reservation/rule page
    console.log('Event clicked:', event);
  };

  const handleDateClick = (date: string, lotId: string) => {
    // TODO: Open quick create modal for reservation/block
    console.log('Date clicked:', date, lotId);
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
          <p className="text-gray-600 mt-1">View and manage your lot availability</p>
        </div>
        <Button onClick={() => setBulkBlockModalOpen(true)}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          Bulk Block Dates
        </Button>
      </div>

      {/* Stats */}
      <CalendarStats metrics={metrics} isLoading={metricsLoading} />

      {/* Filters */}
      <CalendarFilters
        properties={initialProperties}
        selectedPropertyIds={selectedPropertyIds}
        selectedLotIds={selectedLotIds}
        selectedStatuses={selectedStatuses}
        showBlocked={showBlocked}
        onPropertyToggle={togglePropertySelection}
        onLotToggle={toggleLotSelection}
        onStatusToggle={toggleStatusFilter}
        onShowBlockedToggle={toggleShowBlocked}
        onReset={resetFilters}
      />

      {/* Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        view={currentView}
        onPrevious={previousPeriod}
        onNext={nextPeriod}
        onToday={goToToday}
        onViewChange={setView}
      />

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {currentView === 'month' && (
            <MonthView
              currentDate={currentDate}
              selectedLots={selectedProperties}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {currentView === 'week' && (
            <div className="p-12 text-center text-gray-500">
              Week view coming in Phase 2
            </div>
          )}
          {currentView === 'day' && (
            <div className="p-12 text-center text-gray-500">
              Day view coming in Phase 2
            </div>
          )}
        </div>
      )}

      {/* Bulk Block Modal */}
      <BulkBlockModal
        isOpen={bulkBlockModalOpen}
        onClose={() => setBulkBlockModalOpen(false)}
        properties={initialProperties}
        onSuccess={() => {
          fetchEvents();
          fetchMetrics();
        }}
      />
    </div>
  );
}
