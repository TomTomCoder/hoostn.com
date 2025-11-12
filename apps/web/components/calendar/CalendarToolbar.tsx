/**
 * CalendarToolbar Component
 * Navigation toolbar for calendar with prev/next/today buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { formatCalendarDate } from '@/lib/utils/calendar-utils';
import type { CalendarView } from '@/types/calendar';

interface CalendarToolbarProps {
  currentDate: Date;
  view: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange?: (view: CalendarView) => void;
}

export function CalendarToolbar({
  currentDate,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious}>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>

        <Button variant="outline" size="sm" onClick={onNext}>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>

        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>

        <h2 className="text-xl font-bold text-gray-800 ml-4">
          {formatCalendarDate(currentDate, view)}
        </h2>
      </div>

      {/* Right: View Toggle (for future use) */}
      {onViewChange && (
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${
                view === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onViewChange('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 text-sm border-l border-gray-300 ${
                view === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onViewChange('week')}
              disabled
              title="Week view coming soon"
            >
              Week
            </button>
            <button
              className={`px-3 py-1 text-sm border-l border-gray-300 ${
                view === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onViewChange('day')}
              disabled
              title="Day view coming soon"
            >
              Day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
