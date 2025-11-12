'use server';

/**
 * Reservation Management Server Actions
 * Server-side actions for managing reservations with validation and RLS
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Reservation,
  ReservationWithDetails,
  ReservationWithLot,
  ReservationFilters,
  ReservationStats,
  ReservationStatus,
  PaymentStatus,
} from '@/types/booking';

/**
 * Action result type for consistent error handling
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get current user and organization ID
 */
async function getUserAndOrg(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get org_id from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (error || !userData?.org_id) {
    console.error('Failed to get user org_id:', error);
    return null;
  }

  return {
    userId: user.id,
    orgId: userData.org_id,
  };
}

/**
 * Get reservations with filters
 * @param filters - Optional filters for reservations
 */
export async function getReservations(
  filters?: ReservationFilters
): Promise<ActionResult<ReservationWithLot[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    let query = supabase
      .from('reservations')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          property_id,
          primary_image_path:lot_images!lot_id (storage_path)
        )
      `
      )
      .eq('org_id', auth.orgId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    if (filters?.dateFrom) {
      query = query.gte('check_in', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('check_out', filters.dateTo);
    }

    if (filters?.lotId) {
      query = query.eq('lot_id', filters.lotId);
    }

    if (filters?.search) {
      query = query.or(
        `guest_name.ilike.%${filters.search}%,guest_email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      return { success: false, error: 'Failed to fetch reservations' };
    }

    // Transform data to match ReservationWithLot interface
    const reservations: ReservationWithLot[] = data.map((item: any) => ({
      ...item,
      lot: {
        id: item.lot.id,
        title: item.lot.title,
        property_id: item.lot.property_id,
        primary_image_path: item.lot.primary_image_path?.[0]?.storage_path || null,
      },
    }));

    return { success: true, data: reservations };
  } catch (error) {
    console.error('Unexpected error fetching reservations:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get single reservation by ID with full details
 */
export async function getReservationById(
  id: string
): Promise<ActionResult<ReservationWithDetails>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reservations')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          bedrooms,
          bathrooms,
          max_guests,
          property_id,
          property:properties (
            id,
            name,
            address,
            city
          )
        )
      `
      )
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (error) {
      console.error('Error fetching reservation:', error);
      return { success: false, error: 'Reservation not found' };
    }

    // Transform data to match ReservationWithDetails interface
    const reservation: ReservationWithDetails = {
      ...data,
      lot: {
        id: data.lot.id,
        title: data.lot.title,
        bedrooms: data.lot.bedrooms,
        bathrooms: data.lot.bathrooms,
        max_guests: data.lot.max_guests,
        property_id: data.lot.property_id,
      },
      property: data.lot.property,
    };

    return { success: true, data: reservation };
  } catch (error) {
    console.error('Unexpected error fetching reservation:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get reservation statistics for dashboard
 */
export async function getReservationStats(): Promise<ActionResult<ReservationStats>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split('T')[0];
    const lastDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    )
      .toISOString()
      .split('T')[0];

    // Get total reservations this month
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)
      .gte('created_at', firstDayOfMonth)
      .lte('created_at', lastDayOfMonth);

    // Get upcoming check-ins (next 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const { count: upcomingCheckIns } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', auth.orgId)
      .gte('check_in', today)
      .lte('check_in', sevenDaysFromNow)
      .in('status', ['confirmed', 'pending']);

    // Get pending payments
    const { data: pendingPaymentsData } = await supabase
      .from('reservations')
      .select('id, total_price')
      .eq('org_id', auth.orgId)
      .eq('payment_status', 'pending')
      .in('status', ['confirmed', 'pending']);

    const pendingPayments = pendingPaymentsData?.length || 0;
    const pendingPaymentsAmount =
      pendingPaymentsData?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

    // Get revenue this month (paid reservations)
    const { data: revenueData } = await supabase
      .from('reservations')
      .select('total_price')
      .eq('org_id', auth.orgId)
      .eq('payment_status', 'paid')
      .gte('check_in', firstDayOfMonth)
      .lte('check_in', lastDayOfMonth);

    const monthRevenue =
      revenueData?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

    const stats: ReservationStats = {
      totalReservations: totalReservations || 0,
      upcomingCheckIns: upcomingCheckIns || 0,
      pendingPayments,
      pendingPaymentsAmount,
      monthRevenue,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Unexpected error fetching reservation stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}

/**
 * Get upcoming check-ins
 * @param days - Number of days to look ahead (default: 7)
 */
export async function getUpcomingCheckIns(
  days: number = 7
): Promise<ActionResult<ReservationWithLot[]>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('reservations')
      .select(
        `
        *,
        lot:lots (
          id,
          title,
          property_id,
          primary_image_path:lot_images!lot_id (storage_path)
        )
      `
      )
      .eq('org_id', auth.orgId)
      .gte('check_in', today)
      .lte('check_in', futureDate)
      .in('status', ['confirmed', 'pending'])
      .order('check_in', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming check-ins:', error);
      return { success: false, error: 'Failed to fetch upcoming check-ins' };
    }

    // Transform data
    const reservations: ReservationWithLot[] = data.map((item: any) => ({
      ...item,
      lot: {
        id: item.lot.id,
        title: item.lot.title,
        property_id: item.lot.property_id,
        primary_image_path: item.lot.primary_image_path?.[0]?.storage_path || null,
      },
    }));

    return { success: true, data: reservations };
  } catch (error) {
    console.error('Unexpected error fetching upcoming check-ins:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update reservation status
 * @param id - Reservation ID
 * @param status - New status
 */
export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<ActionResult<Reservation>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate status transition
    const supabase = await createClient();
    const { data: current, error: fetchError } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Reservation not found' };
    }

    // Validate status transitions
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['checked_in', 'cancelled'],
      checked_in: ['checked_out'],
      checked_out: [],
      cancelled: [],
    };

    if (!validTransitions[current.status].includes(status)) {
      return {
        success: false,
        error: `Cannot transition from ${current.status} to ${status}`,
      };
    }

    // Update status
    const { data, error } = await supabase
      .from('reservations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation status:', error);
      return { success: false, error: 'Failed to update status' };
    }

    revalidatePath('/dashboard/reservations');
    revalidatePath(`/dashboard/reservations/${id}`);

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error updating reservation status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update payment status
 * @param id - Reservation ID
 * @param paymentStatus - New payment status
 */
export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
): Promise<ActionResult<Reservation>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reservations')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: 'Failed to update payment status' };
    }

    revalidatePath('/dashboard/reservations');
    revalidatePath(`/dashboard/reservations/${id}`);

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error updating payment status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Cancel reservation
 * @param id - Reservation ID
 * @param reason - Cancellation reason (optional)
 */
export async function cancelReservation(
  id: string,
  reason?: string
): Promise<ActionResult<Reservation>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Check if reservation can be cancelled
    const { data: current, error: fetchError } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Reservation not found' };
    }

    if (['checked_out', 'cancelled'].includes(current.status)) {
      return {
        success: false,
        error: 'Cannot cancel a reservation that is already completed or cancelled',
      };
    }

    // Update to cancelled
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling reservation:', error);
      return { success: false, error: 'Failed to cancel reservation' };
    }

    revalidatePath('/dashboard/reservations');
    revalidatePath(`/dashboard/reservations/${id}`);

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error cancelling reservation:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get properties and lots for filters
 */
export async function getPropertiesForFilter(): Promise<
  ActionResult<Array<{ id: string; name: string; lots: Array<{ id: string; title: string }> }>>
> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('properties')
      .select(
        `
        id,
        name,
        lots (
          id,
          title
        )
      `
      )
      .eq('org_id', auth.orgId)
      .order('name');

    if (error) {
      console.error('Error fetching properties for filter:', error);
      return { success: false, error: 'Failed to fetch properties' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error fetching properties:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
