/**
 * Stripe Payments Service
 * Functions for managing payment intents and transactions
 */

import { stripe, STRIPE_CONFIG, calculatePlatformFee, eurosToCents } from './client';
import { createClient } from '@/lib/supabase/server';
import type {
  PaymentBreakdown,
  CreatePaymentIntentInput,
  PaymentMode,
} from '@/types/stripe';

/**
 * Calculate payment breakdown for a reservation
 * @param accommodationTotal - Total accommodation cost (nights × rate)
 * @param cleaningFee - Cleaning fee
 * @param touristTax - Tourist tax
 * @param securityDeposit - Optional security deposit
 * @returns Payment breakdown with all fees
 */
export function calculatePaymentBreakdown(
  accommodationTotal: number,
  cleaningFee: number,
  touristTax: number,
  securityDeposit: number = 0
): PaymentBreakdown {
  const subtotal = accommodationTotal + cleaningFee + touristTax;
  const platformFee = (subtotal * STRIPE_CONFIG.platformFeePercentage) / 100;
  const total = subtotal; // Guest pays subtotal (platform fee is deducted from host)
  const hostPayout = subtotal - platformFee;

  return {
    accommodationTotal: Number(accommodationTotal.toFixed(2)),
    cleaningFee: Number(cleaningFee.toFixed(2)),
    touristTax: Number(touristTax.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    securityDeposit: Number(securityDeposit.toFixed(2)),
    total: Number(total.toFixed(2)),
    hostPayout: Number(hostPayout.toFixed(2)),
    currency: STRIPE_CONFIG.currency.toUpperCase(),
  };
}

/**
 * Create a payment intent for a reservation
 * @param input - Payment intent creation parameters
 * @returns Payment intent details
 */
export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<{
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get reservation details
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, lot:lots!inner(org_id)')
      .eq('id', input.reservationId)
      .single();

    if (resError || !reservation) {
      return { success: false, error: 'Reservation not found' };
    }

    const orgId = reservation.lot.org_id;

    // Get organization's Stripe account
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_connected_account_id, platform_fee_percentage')
      .eq('id', orgId)
      .single();

    if (orgError || !org?.stripe_connected_account_id) {
      return { success: false, error: 'Stripe Connect not configured for this organization' };
    }

    const stripeAccountId = org.stripe_connected_account_id;
    const platformFeePercentage = org.platform_fee_percentage || STRIPE_CONFIG.platformFeePercentage;

    // Calculate amounts in cents
    const amountCents = eurosToCents(input.amount);
    const platformFeeCents = calculatePlatformFee(amountCents, platformFeePercentage);

    // Determine capture method based on payment mode
    const captureMethod = input.paymentMode === 'hold-72h' ? 'manual' : 'automatic';

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: input.currency || STRIPE_CONFIG.currency,
        application_fee_amount: platformFeeCents,
        capture_method: captureMethod,
        metadata: {
          reservation_id: input.reservationId,
          org_id: orgId,
          ...(input.metadata || {}),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    // Save payment intent to database
    const { data: dbPaymentIntent, error: dbError } = await supabase
      .from('payment_intents')
      .insert({
        org_id: orgId,
        reservation_id: input.reservationId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_account_id: stripeAccountId,
        amount: input.amount,
        platform_fee_amount: input.platformFeeAmount,
        application_fee_amount: platformFeeCents / 100,
        currency: (input.currency || STRIPE_CONFIG.currency).toUpperCase(),
        status: 'pending',
        capture_method: captureMethod,
        client_secret: paymentIntent.client_secret,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save payment intent to database:', dbError);
      // Try to cancel the Stripe payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id, {
        stripeAccount: stripeAccountId,
      });
      return { success: false, error: 'Failed to save payment intent' };
    }

    // Update reservation with payment intent ID
    await supabase
      .from('reservations')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        platform_fee_amount: input.platformFeeAmount,
        payment_mode: input.paymentMode || 'full',
        security_deposit_amount: input.securityDepositAmount || 0,
      })
      .eq('id', input.reservationId);

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    };
  }
}

/**
 * Capture a held payment intent (for hold-72h mode)
 * @param paymentIntentId - Stripe payment intent ID
 * @returns Success status
 */
export async function capturePaymentIntent(paymentIntentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get payment intent from database
    const { data: dbIntent, error: dbError } = await supabase
      .from('payment_intents')
      .select('*, stripe_account_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (dbError || !dbIntent) {
      return { success: false, error: 'Payment intent not found' };
    }

    // Capture payment with Stripe
    const paymentIntent = await stripe.paymentIntents.capture(
      paymentIntentId,
      {},
      {
        stripeAccount: dbIntent.stripe_account_id,
      }
    );

    // Update database
    await supabase
      .from('payment_intents')
      .update({
        status: 'succeeded',
        captured_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    // Update reservation
    if (dbIntent.reservation_id) {
      await supabase
        .from('reservations')
        .update({
          payment_status: 'paid',
          payment_captured_at: new Date().toISOString(),
        })
        .eq('id', dbIntent.reservation_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to capture payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture payment',
    };
  }
}

/**
 * Cancel a payment intent
 * @param paymentIntentId - Stripe payment intent ID
 * @param reason - Cancellation reason
 * @returns Success status
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get payment intent from database
    const { data: dbIntent, error: dbError } = await supabase
      .from('payment_intents')
      .select('*, stripe_account_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (dbError || !dbIntent) {
      return { success: false, error: 'Payment intent not found' };
    }

    // Cancel with Stripe
    await stripe.paymentIntents.cancel(
      paymentIntentId,
      {
        cancellation_reason: 'requested_by_customer',
      },
      {
        stripeAccount: dbIntent.stripe_account_id,
      }
    );

    // Update database
    await supabase
      .from('payment_intents')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: reason || 'Requested by customer',
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel payment',
    };
  }
}

/**
 * Get payment intent status
 * @param paymentIntentId - Stripe payment intent ID
 * @returns Payment intent details
 */
export async function getPaymentIntentStatus(paymentIntentId: string): Promise<{
  success: boolean;
  status?: string;
  amount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: intent, error } = await supabase
      .from('payment_intents')
      .select('status, amount')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error || !intent) {
      return { success: false, error: 'Payment intent not found' };
    }

    return {
      success: true,
      status: intent.status,
      amount: intent.amount,
    };
  } catch (error) {
    console.error('Failed to get payment intent status:', error);
    return {
      success: false,
      error: 'Failed to retrieve payment status',
    };
  }
}
