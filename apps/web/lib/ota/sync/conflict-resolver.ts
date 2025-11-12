/**
 * OTA Conflict Resolver
 * Detects and manages booking conflicts during OTA synchronization
 */

import { createClient } from '@/lib/supabase/server';
import type { Reservation } from '@/types/booking';

/**
 * Check if there are conflicting reservations for given dates
 * @param lotId - Lot ID to check
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @param excludeReservationId - Optional reservation ID to exclude from conflict check
 * @returns True if there are conflicts
 */
export async function detectConflicts(
  lotId: string,
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Build query to find overlapping reservations
    let query = supabase
      .from('reservations')
      .select('id, check_in, check_out, status')
      .eq('lot_id', lotId)
      .in('status', ['confirmed', 'checked_in', 'pending']) // Only active reservations
      .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`); // Date overlap logic

    // Exclude specific reservation if provided
    if (excludeReservationId) {
      query = query.neq('id', excludeReservationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error in detectConflicts:', error);
    throw error;
  }
}

/**
 * Get detailed information about conflicting reservations
 * @param lotId - Lot ID to check
 * @param checkIn - Check-in date (YYYY-MM-DD)
 * @param checkOut - Check-out date (YYYY-MM-DD)
 * @param excludeReservationId - Optional reservation ID to exclude
 * @returns Array of conflicting reservations
 */
export async function getConflictDetails(
  lotId: string,
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string
): Promise<Reservation[]> {
  try {
    const supabase = await createClient();

    // Build query to find overlapping reservations
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('lot_id', lotId)
      .in('status', ['confirmed', 'checked_in', 'pending'])
      .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`);

    if (excludeReservationId) {
      query = query.neq('id', excludeReservationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting conflict details:', error);
      throw error;
    }

    return (data as Reservation[]) || [];
  } catch (error) {
    console.error('Error in getConflictDetails:', error);
    throw error;
  }
}

/**
 * Determine conflict type based on date overlap
 * @param localCheckIn - Local reservation check-in
 * @param localCheckOut - Local reservation check-out
 * @param remoteCheckIn - Remote booking check-in
 * @param remoteCheckOut - Remote booking check-out
 * @returns Conflict type
 */
export function determineConflictType(
  localCheckIn: string,
  localCheckOut: string,
  remoteCheckIn: string,
  remoteCheckOut: string
): 'double_booking' | 'date_overlap' {
  const localIn = new Date(localCheckIn);
  const localOut = new Date(localCheckOut);
  const remoteIn = new Date(remoteCheckIn);
  const remoteOut = new Date(remoteCheckOut);

  // Check if dates match exactly (double booking)
  if (
    localIn.getTime() === remoteIn.getTime() &&
    localOut.getTime() === remoteOut.getTime()
  ) {
    return 'double_booking';
  }

  // Otherwise it's a partial overlap
  return 'date_overlap';
}

/**
 * Check if a date range is valid (check-out after check-in)
 */
export function isValidDateRange(checkIn: string, checkOut: string): boolean {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return checkOutDate > checkInDate;
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return date < today;
}

/**
 * Format date range for display
 */
export function formatDateRange(checkIn: string, checkOut: string): string {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = calculateNights(checkIn, checkOut);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const checkInStr = checkInDate.toLocaleDateString('en-US', options);
  const checkOutStr = checkOutDate.toLocaleDateString('en-US', options);

  return `${checkInStr} - ${checkOutStr} (${nights} night${nights !== 1 ? 's' : ''})`;
}
