'use server';

/**
 * Stripe Payments Server Actions
 * Server-side actions for managing payments and refunds
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  calculatePaymentBreakdown,
} from '@/lib/stripe/payments';
import { createRefund } from '@/lib/stripe/refunds';
import type { ActionResult } from './reservations';
import type {
  PaymentBreakdown,
  PaymentMode,
  CreatePaymentIntentInput,
} from '@/types/stripe';

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
 * Create a payment for a booking
 * @param reservationId - Reservation ID
 * @param paymentMode - Payment capture mode (full or hold-72h)
 */
export async function createBookingPayment(
  reservationId: string,
  paymentMode: PaymentMode = 'full'
): Promise<
  ActionResult<{
    paymentIntentId: string;
    clientSecret: string;
  }>
> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get reservation with lot details
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select(
        `
        *,
        lot:lots!inner(
          id,
          org_id,
          base_price,
          cleaning_fee,
          tourist_tax
        )
      `
      )
      .eq('id', reservationId)
      .eq('org_id', auth.orgId)
      .single();

    if (resError || !reservation) {
      return { success: false, error: 'Reservation not found' };
    }

    // Check if payment already exists
    if (reservation.stripe_payment_intent_id) {
      return { success: false, error: 'Payment already created for this reservation' };
    }

    // Get organization's platform fee
    const { data: org } = await supabase
      .from('organizations')
      .select('platform_fee_percentage')
      .eq('id', auth.orgId)
      .single();

    const platformFeePercentage = org?.platform_fee_percentage || 5.0;

    // Calculate payment breakdown
    const totalPrice = reservation.total_price;
    const platformFeeAmount = (totalPrice * platformFeePercentage) / 100;

    // Create payment intent
    const paymentInput: CreatePaymentIntentInput = {
      reservationId,
      amount: totalPrice,
      platformFeeAmount,
      paymentMode,
      currency: 'eur',
      metadata: {
        guest_name: reservation.guest_name,
        guest_email: reservation.guest_email,
        check_in: reservation.check_in,
        check_out: reservation.check_out,
      },
    };

    const result = await createPaymentIntent(paymentInput);

    if (!result.success || !result.paymentIntentId || !result.clientSecret) {
      return { success: false, error: result.error || 'Failed to create payment' };
    }

    revalidatePath(`/dashboard/reservations/${reservationId}`);
    revalidatePath('/dashboard/reservations');

    return {
      success: true,
      data: {
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
      },
    };
  } catch (error) {
    console.error('Failed to create booking payment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Capture a held payment (for hold-72h mode)
 * @param paymentIntentId - Stripe payment intent ID
 */
export async function captureHeldPayment(
  paymentIntentId: string
): Promise<ActionResult<{ captured: boolean }>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify payment belongs to user's org
    const { data: payment, error } = await supabase
      .from('payment_intents')
      .select('id, reservation_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Capture payment
    const result = await capturePaymentIntent(paymentIntentId);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to capture payment' };
    }

    if (payment.reservation_id) {
      revalidatePath(`/dashboard/reservations/${payment.reservation_id}`);
      revalidatePath('/dashboard/reservations');
    }

    return { success: true, data: { captured: true } };
  } catch (error) {
    console.error('Failed to capture payment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Refund a booking payment
 * @param reservationId - Reservation ID
 * @param amount - Amount to refund (optional, full refund if not provided)
 * @param reason - Refund reason
 */
export async function refundBooking(
  reservationId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<ActionResult<{ refundId: string }>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get payment intent for reservation
    const { data: payment, error } = await supabase
      .from('payment_intents')
      .select('id, stripe_payment_intent_id, amount')
      .eq('reservation_id', reservationId)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !payment) {
      return { success: false, error: 'Payment not found for this reservation' };
    }

    // Validate amount
    if (amount && amount > payment.amount) {
      return { success: false, error: 'Refund amount exceeds payment amount' };
    }

    // Create refund
    const result = await createRefund({
      paymentIntentId: payment.id,
      amount,
      reason: reason || 'requested_by_customer',
      metadata: {
        reservation_id: reservationId,
      },
    });

    if (!result.success || !result.refundId) {
      return { success: false, error: result.error || 'Failed to create refund' };
    }

    revalidatePath(`/dashboard/reservations/${reservationId}`);
    revalidatePath('/dashboard/reservations');

    return { success: true, data: { refundId: result.refundId } };
  } catch (error) {
    console.error('Failed to refund booking:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get payment breakdown for a reservation
 * @param reservationId - Reservation ID
 */
export async function getPaymentBreakdownAction(
  reservationId: string
): Promise<ActionResult<PaymentBreakdown>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get reservation details
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(
        `
        *,
        lot:lots!inner(
          base_price,
          cleaning_fee,
          tourist_tax
        )
      `
      )
      .eq('id', reservationId)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !reservation) {
      return { success: false, error: 'Reservation not found' };
    }

    // Calculate nights
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate breakdown
    const accommodationTotal = nights * (reservation.lot.base_price || 0);
    const breakdown = calculatePaymentBreakdown(
      accommodationTotal,
      reservation.lot.cleaning_fee || 0,
      (reservation.lot.tourist_tax || 0) * reservation.guests_count * nights,
      reservation.security_deposit_amount || 0
    );

    return { success: true, data: breakdown };
  } catch (error) {
    console.error('Failed to get payment breakdown:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Cancel a payment intent
 * @param paymentIntentId - Stripe payment intent ID
 */
export async function cancelPayment(
  paymentIntentId: string
): Promise<ActionResult<{ canceled: boolean }>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Verify payment belongs to user's org
    const { data: payment, error } = await supabase
      .from('payment_intents')
      .select('id, reservation_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('org_id', auth.orgId)
      .single();

    if (error || !payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Cancel payment
    const result = await cancelPaymentIntent(paymentIntentId, 'Canceled by host');

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to cancel payment' };
    }

    if (payment.reservation_id) {
      revalidatePath(`/dashboard/reservations/${payment.reservation_id}`);
      revalidatePath('/dashboard/reservations');
    }

    return { success: true, data: { canceled: true } };
  } catch (error) {
    console.error('Failed to cancel payment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
