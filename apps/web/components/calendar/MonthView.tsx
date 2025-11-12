/**
 * MonthView Component
 * Month view calendar grid showing reservations across multiple lots
 */

'use client';

import type { CalendarEvent, PropertyWithLots } from '@/types/calendar';
import { CalendarCell } from './CalendarCell';
import { getDaysInMonth, getDayAbbreviation } from '@/lib/utils/calendar-utils';
import { useMemo } from 'react';

interface MonthViewProps {
  currentDate: Date;
  selectedLots: PropertyWithLots[];
  events: CalendarEvent[];
  onDateClick?: (date: string, lotId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function MonthView({
  currentDate,
  selectedLots,
  events,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  // Flatten selected lots
  const flatLots = useMemo(() => {
    return selectedLots.flatMap((property) =>
      property.lots
        .filter((lot) => lot.status === 'active')
        .map((lot) => ({
          ...lot,
          propertyName: property.name,
          propertyId: property.id,
        }))
    );
  }, [selectedLots]);

  if (flatLots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No lots selected</p>
          <p className="text-sm text-gray-500">Select properties or lots from the filters above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Grid Container */}
        <div
          className="grid border-l border-t border-gray-200"
          style={{
            gridTemplateColumns: `120px repeat(${flatLots.length}, minmax(200px, 1fr))`,
          }}
        >
          {/* Header Row - Day of Week */}
          <div className="sticky left-0 z-20 bg-white border-r border-b border-gray-300 p-2 font-semibold text-gray-700">
            Date
          </div>
          {flatLots.map((lot) => (
            <div
              key={lot.id}
              className="bg-white border-r border-b border-gray-300 p-2 sticky top-0 z-10"
            >
              <div className="font-semibold text-gray-800 truncate">{lot.title}</div>
              <div className="text-xs text-gray-600 truncate">{lot.propertyName}</div>
            </div>
          ))}

          {/* Calendar Grid Rows */}
          {days.map((day) => (
            <>
              {/* Date Column */}
              <div
                key={`date-${day.dateStr}`}
                className={`
                  sticky left-0 z-10 border-r border-b border-gray-300 p-2
                  ${day.isToday ? 'bg-blue-100' : day.isWeekend ? 'bg-gray-100' : 'bg-white'}
                `}
              >
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 uppercase">
                    {getDayAbbreviation(day.date.getDay())}
                  </span>
                  <span
                    className={`text-lg font-semibold ${
                      day.isToday ? 'text-blue-600' : 'text-gray-800'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>
              </div>

              {/* Event Cells for Each Lot */}
              {flatLots.map((lot) => (
                <CalendarCell
                  key={`cell-${day.dateStr}-${lot.id}`}
                  date={day.dateStr}
                  lotId={lot.id}
                  events={events}
                  isToday={day.isToday}
                  isWeekend={day.isWeekend}
                  onClick={onDateClick}
                  onEventClick={onEventClick}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
