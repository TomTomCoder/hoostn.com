/**
 * ReservationCard Component
 * Compact card for displaying reservations in the calendar grid
 */

'use client';

import type { CalendarEvent } from '@/types/calendar';
import { getStatusColor, calculateNights } from '@/lib/utils/calendar-utils';
import { Badge } from '@/components/ui/badge';

interface ReservationCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export function ReservationCard({ event, compact = false, onClick }: ReservationCardProps) {
  if (event.type === 'blocked') {
    return (
      <div
        className="rounded border border-gray-300 bg-gray-100 p-1.5 text-xs cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
          <span className="font-medium text-gray-700 truncate">Blocked</span>
        </div>
        {!compact && event.reason && (
          <div className="text-gray-600 mt-0.5 truncate">{event.reason}</div>
        )}
      </div>
    );
  }

  const colors = event.status ? getStatusColor(event.status) : getStatusColor('pending');
  const nights = calculateNights(event.startDate, event.endDate);

  return (
    <div
      className={`rounded border ${colors.border} ${colors.bg} p-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${colors.text} truncate`}>
            {event.guestName || 'Guest'}
          </div>
          {!compact && (
            <>
              <div className="text-gray-600 mt-0.5 truncate">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </div>
              {event.guestsCount && (
                <div className="text-gray-600 mt-0.5">
                  {event.guestsCount} {event.guestsCount === 1 ? 'guest' : 'guests'}
                </div>
              )}
            </>
          )}
        </div>
        {event.status && (
          <Badge
            variant="secondary"
            className={`${colors.bg} ${colors.text} text-[10px] px-1 py-0 h-4`}
          >
            {event.status}
          </Badge>
        )}
      </div>
      {!compact && event.channel && event.channel !== 'direct' && (
        <div className="text-gray-500 mt-1 text-[10px] truncate uppercase">
          {event.channel}
        </div>
      )}
    </div>
  );
}
