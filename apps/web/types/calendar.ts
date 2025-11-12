/**
 * Calendar Type Definitions
 * TypeScript interfaces for advanced multi-lot calendar system
 */

import type { ReservationStatus } from './booking';

/**
 * Calendar view types (MVP: month only)
 */
export type CalendarView = 'month' | 'week' | 'day';

/**
 * Calendar event representing a reservation or blocked date
 */
export interface CalendarEvent {
  id: string;
  lotId: string;
  lotTitle: string;
  propertyId: string;
  propertyName: string;
  type: 'reservation' | 'blocked';
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)

  // Reservation-specific fields
  guestName?: string;
  guestEmail?: string;
  guestsCount?: number;
  totalPrice?: number;
  status?: ReservationStatus;
  channel?: string;

  // Blocked date fields
  reason?: string;
  ruleType?: 'blocked' | 'price_override' | 'min_stay';
}

/**
 * Calendar filters
 */
export interface CalendarFilters {
  propertyIds: string[];
  lotIds: string[];
  statuses: ReservationStatus[];
  showBlocked: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Calendar cell data for a specific lot/date
 */
export interface CalendarCell {
  date: string; // ISO date string
  lotId: string;
  events: CalendarEvent[];
  isBlocked: boolean;
  isToday: boolean;
  isWeekend: boolean;
  occupancyRate: number; // 0-1
}

/**
 * Calendar preferences (persisted)
 */
export interface CalendarPreferences {
  defaultView: CalendarView;
  selectedPropertyIds: string[];
  selectedLotIds: string[];
  showWeekends: boolean;
  colorScheme: 'status' | 'property' | 'lot';
}

/**
 * Calendar metrics for heatmap and stats
 */
export interface CalendarMetrics {
  lotId: string;
  dateRange: {
    start: string;
    end: string;
  };
  occupancyRate: number; // 0-1
  totalRevenue: number;
  bookingCount: number;
  averageNightlyRate: number;
  blockedDays: number;
}

/**
 * Property with lots for filter dropdown
 */
export interface PropertyWithLots {
  id: string;
  name: string;
  lots: Array<{
    id: string;
    title: string;
    status: 'active' | 'inactive' | 'maintenance';
  }>;
}

/**
 * Bulk date blocking input
 */
export interface BulkBlockInput {
  lotIds: string[];
  startDate: string;
  endDate: string;
  reason: string;
  ruleType: 'blocked';
}

/**
 * Calendar state for date range display
 */
export interface CalendarDateRange {
  start: Date;
  end: Date;
  current: Date;
}

/**
 * Day in calendar grid
 */
export interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  isCurrentMonth: boolean;
}

/**
 * Week in calendar grid
 */
export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}
