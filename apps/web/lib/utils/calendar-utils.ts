/**
 * Calendar Utility Functions
 * Helper functions for calendar date manipulation, formatting, and styling
 */

import type { CalendarView, CalendarDay, CalendarWeek } from '@/types/calendar';
import type { ReservationStatus } from '@/types/booking';

/**
 * Get date range for a given calendar view
 * @param date - Current date
 * @param view - Calendar view type
 * @returns Date range object with start and end dates
 */
export function getDateRangeForView(
  date: Date,
  view: CalendarView
): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  if (view === 'month') {
    // Start: First day of month
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    // End: Last day of month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (view === 'week') {
    // Start: First day of week (Monday)
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    // End: Last day of week (Sunday)
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    // Day view
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

/**
 * Get expanded date range for fetching data (includes adjacent months)
 * @param date - Current date
 * @param view - Calendar view type
 * @returns Expanded date range
 */
export function getExpandedDateRange(
  date: Date,
  view: CalendarView
): { start: string; end: string } {
  const range = getDateRangeForView(date, view);

  // Add buffer for better UX (fetch ±1 month)
  const start = new Date(range.start);
  start.setMonth(start.getMonth() - 1);

  const end = new Date(range.end);
  end.setMonth(end.getMonth() + 1);

  return {
    start: formatDateISO(start),
    end: formatDateISO(end),
  };
}

/**
 * Get all days in a month
 * @param date - Date in the month
 * @returns Array of CalendarDay objects
 */
export function getDaysInMonth(date: Date): CalendarDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDay[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const current = new Date(year, month, day);
    const dateStr = formatDateISO(current);
    const dayOfWeek = current.getDay();

    days.push({
      date: current,
      dateStr,
      dayNumber: day,
      isToday: current.getTime() === today.getTime(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isCurrentMonth: true,
    });
  }

  return days;
}

/**
 * Get weeks in a month (2D array)
 * @param date - Date in the month
 * @returns Array of CalendarWeek objects
 */
export function getWeeksInMonth(date: Date): CalendarWeek[] {
  const days = getDaysInMonth(date);
  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarDay[] = [];
  let weekNumber = 1;

  // Add padding days at the start if needed
  const firstDayOfWeek = days[0].date.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  for (let i = 0; i < paddingDays; i++) {
    const paddingDate = new Date(days[0].date);
    paddingDate.setDate(paddingDate.getDate() - (paddingDays - i));
    currentWeek.push({
      date: paddingDate,
      dateStr: formatDateISO(paddingDate),
      dayNumber: paddingDate.getDate(),
      isToday: false,
      isWeekend: paddingDate.getDay() === 0 || paddingDate.getDay() === 6,
      isCurrentMonth: false,
    });
  }

  // Add actual days
  for (const day of days) {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push({ weekNumber, days: currentWeek });
      currentWeek = [];
      weekNumber++;
    }
  }

  // Add padding days at the end if needed
  if (currentWeek.length > 0) {
    const remainingDays = 7 - currentWeek.length;
    const lastDay = days[days.length - 1].date;

    for (let i = 1; i <= remainingDays; i++) {
      const paddingDate = new Date(lastDay);
      paddingDate.setDate(paddingDate.getDate() + i);
      currentWeek.push({
        date: paddingDate,
        dateStr: formatDateISO(paddingDate),
        dayNumber: paddingDate.getDate(),
        isToday: false,
        isWeekend: paddingDate.getDay() === 0 || paddingDate.getDay() === 6,
        isCurrentMonth: false,
      });
    }

    weeks.push({ weekNumber, days: currentWeek });
  }

  return weeks;
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO formatted date string
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display in calendar
 * @param date - Date to format
 * @param view - Calendar view
 * @returns Formatted date string
 */
export function formatCalendarDate(date: Date, view: CalendarView): string {
  if (view === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (view === 'week') {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Get color for reservation status
 * @param status - Reservation status
 * @returns Tailwind color classes
 */
export function getStatusColor(status: ReservationStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
      };
    case 'confirmed':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
      };
    case 'checked_in':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
      };
    case 'checked_out':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
      };
    case 'cancelled':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
      };
  }
}

/**
 * Get color based on occupancy rate (for heatmap)
 * @param occupancy - Occupancy rate (0-1)
 * @returns Tailwind background color class
 */
export function getOccupancyColor(occupancy: number): string {
  if (occupancy >= 0.8) {
    return 'bg-green-500/20';
  } else if (occupancy >= 0.6) {
    return 'bg-green-400/20';
  } else if (occupancy >= 0.4) {
    return 'bg-yellow-400/20';
  } else if (occupancy >= 0.2) {
    return 'bg-orange-400/20';
  } else if (occupancy > 0) {
    return 'bg-red-400/20';
  }
  return 'bg-white';
}

/**
 * Check if a date is between two dates (inclusive)
 * @param date - Date to check
 * @param start - Start date
 * @param end - End date
 * @returns True if date is in range
 */
export function isDateInRange(date: string, start: string, end: string): boolean {
  const d = new Date(date);
  const s = new Date(start);
  const e = new Date(end);
  return d >= s && d <= e;
}

/**
 * Calculate number of nights between two dates
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Number of nights
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get short month name
 * @param monthIndex - Month index (0-11)
 * @returns Short month name
 */
export function getShortMonthName(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
}

/**
 * Get day of week abbreviation
 * @param dayIndex - Day index (0-6, Sunday-Saturday)
 * @returns Day abbreviation
 */
export function getDayAbbreviation(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
}
