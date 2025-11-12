/**
 * CalendarCell Component
 * Displays events for a specific lot and date in the calendar grid
 */

'use client';

import type { CalendarEvent } from '@/types/calendar';
import { ReservationCard } from './ReservationCard';
import { isDateInRange } from '@/lib/utils/calendar-utils';
import { useState } from 'react';

interface CalendarCellProps {
  date: string; // ISO date string (YYYY-MM-DD)
  lotId: string;
  events: CalendarEvent[];
  isToday?: boolean;
  isWeekend?: boolean;
  onClick?: (date: string, lotId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarCell({
  date,
  lotId,
  events,
  isToday = false,
  isWeekend = false,
  onClick,
  onEventClick,
}: CalendarCellProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter events that overlap with this date
  const relevantEvents = events.filter(
    (event) =>
      event.lotId === lotId && isDateInRange(date, event.startDate, event.endDate)
  );

  // Show first 3 events by default
  const maxVisible = 3;
  const visibleEvents = showAll ? relevantEvents : relevantEvents.slice(0, maxVisible);
  const hiddenCount = relevantEvents.length - maxVisible;

  const handleCellClick = () => {
    if (onClick) {
      onClick(date, lotId);
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div
      className={`
        min-h-24 p-2 border-r border-b border-gray-200
        ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'}
        hover:bg-gray-50 transition-colors cursor-pointer
      `}
      onClick={handleCellClick}
    >
      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <div key={event.id} onClick={(e) => handleEventClick(event, e)}>
            <ReservationCard event={event} compact={relevantEvents.length > 2} />
          </div>
        ))}

        {hiddenCount > 0 && !showAll && (
          <button
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(true);
            }}
          >
            +{hiddenCount} more
          </button>
        )}

        {showAll && hiddenCount > 0 && (
          <button
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(false);
            }}
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}
