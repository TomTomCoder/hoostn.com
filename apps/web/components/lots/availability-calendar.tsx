'use client';

import { useState } from 'react';

interface AvailabilityRule {
  id: string;
  start_date: string;
  end_date: string;
  rule_type: 'blocked' | 'price_override' | 'min_stay';
  price_per_night?: number | null;
  min_nights?: number | null;
  reason?: string | null;
}

interface AvailabilityCalendarProps {
  availabilityRules?: AvailabilityRule[];
  reservations?: Array<{
    check_in: string;
    check_out: string;
    guest_name: string;
  }>;
  readOnly?: boolean;
}

export function AvailabilityCalendar({
  availabilityRules = [],
  reservations = [],
  readOnly = true,
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null); // Empty cells before first day
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if a date is blocked, reserved, or has special pricing
  const getDateStatus = (day: number | null) => {
    if (!day) return null;

    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    // Check reservations
    const isReserved = reservations.some((reservation) => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      return date >= checkIn && date < checkOut;
    });

    if (isReserved) {
      return { type: 'reserved', color: 'bg-blue-100 text-blue-700' };
    }

    // Check availability rules
    for (const rule of availabilityRules) {
      const ruleStart = new Date(rule.start_date);
      const ruleEnd = new Date(rule.end_date);

      if (date >= ruleStart && date <= ruleEnd) {
        if (rule.rule_type === 'blocked') {
          return { type: 'blocked', color: 'bg-red-100 text-red-700 line-through' };
        } else if (rule.rule_type === 'price_override') {
          return { type: 'price_override', color: 'bg-accent/10 text-accent font-semibold' };
        } else if (rule.rule_type === 'min_stay') {
          return { type: 'min_stay', color: 'bg-yellow-100 text-yellow-700' };
        }
      }
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return { type: 'past', color: 'text-gray-400' };
    }

    return { type: 'available', color: 'text-gray-anthracite hover:bg-gray-100' };
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-anthracite">
          {monthName}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label="Previous month"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label="Next month"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const status = getDateStatus(day);
            return (
              <div
                key={index}
                className={`
                  p-3 text-center border-b border-r border-gray-100 min-h-[60px]
                  ${day ? 'cursor-default' : ''}
                  ${status ? status.color : 'bg-gray-50'}
                `}
              >
                {day && (
                  <div className="text-sm">
                    <span>{day}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2" />
          <span className="text-gray-600">Reserved</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2" />
          <span className="text-gray-600">Blocked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-accent/10 border border-accent/20 rounded mr-2" />
          <span className="text-gray-600">Special Price</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2" />
          <span className="text-gray-600">Min Stay</span>
        </div>
      </div>

      {/* Summary */}
      {!readOnly && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Click on dates to add blocking rules or price overrides
          </p>
        </div>
      )}
    </div>
  );
}
