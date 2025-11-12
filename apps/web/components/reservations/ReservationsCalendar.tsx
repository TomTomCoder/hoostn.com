'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ReservationWithLot, ReservationStatus } from '@/types/booking';
import { clsx } from 'clsx';

interface ReservationsCalendarProps {
  reservations: ReservationWithLot[];
}

/**
 * Reservations calendar component
 * Displays reservations in a month view calendar
 */
export function ReservationsCalendar({ reservations }: ReservationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get month boundaries
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = monthStart.getDay();

  // Calculate padding days for calendar grid
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Get reservations for a specific date
  const getReservationsForDate = (date: Date) => {
    return reservations.filter((reservation) => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      return date >= checkIn && date < checkOut;
    });
  };

  // Status color mapping
  const getStatusColor = (status: ReservationStatus): string => {
    const colors: Record<ReservationStatus, string> = {
      pending: 'bg-yellow-200 text-yellow-800 border-yellow-400',
      confirmed: 'bg-green-200 text-green-800 border-green-400',
      checked_in: 'bg-blue-200 text-blue-800 border-blue-400',
      checked_out: 'bg-gray-200 text-gray-800 border-gray-400',
      cancelled: 'bg-red-200 text-red-800 border-red-400',
    };
    return colors[status];
  };

  const today = new Date();

  return (
    <Card>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-anthracite">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 uppercase py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Padding days */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}

          {/* Month days */}
          {daysInMonth.map((day) => {
            const dayReservations = getReservationsForDate(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  'aspect-square border rounded-lg p-2 relative',
                  isToday
                    ? 'border-primary border-2 bg-primary/5'
                    : 'border-gray-200 bg-white',
                  dayReservations.length > 0 ? 'hover:shadow-md' : ''
                )}
              >
                {/* Day number */}
                <div
                  className={clsx(
                    'text-sm font-medium mb-1',
                    isToday ? 'text-primary font-bold' : 'text-gray-700'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Reservations */}
                <div className="space-y-1 overflow-y-auto max-h-20">
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <Link
                      key={reservation.id}
                      href={`/dashboard/reservations/${reservation.id}`}
                      className={clsx(
                        'block text-xs px-1 py-0.5 rounded border truncate',
                        getStatusColor(reservation.status)
                      )}
                      title={`${reservation.guest_name} - ${reservation.lot.title}`}
                    >
                      {reservation.lot.title}
                    </Link>
                  ))}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayReservations.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded" />
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border border-green-400 rounded" />
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded" />
            <span className="text-gray-600">Checked In</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded" />
            <span className="text-gray-600">Checked Out</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border border-red-400 rounded" />
            <span className="text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
