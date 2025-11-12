/**
 * Stripe Refunds Service
 * Functions for managing refunds
 */

import { stripe, eurosToCents } from './client';
import { createClient } from '@/lib/supabase/server';
import type { CreateRefundInput, RefundStatus } from '@/types/stripe';

/**
 * Create a refund for a payment intent
 * @param input - Refund creation parameters
 * @returns Refund details
 */
export async function createRefund(input: CreateRefundInput): Promise<{
  success: boolean;
  refundId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get payment intent from database
    const { data: dbIntent, error: dbError } = await supabase
      .from('payment_intents')
      .select('*, reservation:reservations!payment_intents_reservation_id_fkey(org_id)')
      .eq('id', input.paymentIntentId)
      .single();

    if (dbError || !dbIntent) {
      return { success: false, error: 'Payment intent not found' };
    }

    // Check if payment was successful
    if (dbIntent.status !== 'succeeded') {
      return { success: false, error: 'Payment has not been captured yet' };
    }

    // Calculate refund amount
    const refundAmount = input.amount
      ? eurosToCents(input.amount)
      : eurosToCents(dbIntent.amount);

    // Create refund with Stripe
    const refund = await stripe.refunds.create(
      {
        payment_intent: dbIntent.stripe_payment_intent_id,
        amount: refundAmount,
        reason: input.reason,
        metadata: {
          payment_intent_id: input.paymentIntentId,
          ...(input.metadata || {}),
        },
      },
      {
        stripeAccount: dbIntent.stripe_account_id,
      }
    );

    // Save refund to database
    const { data: dbRefund, error: refundDbError } = await supabase
      .from('refunds')
      .insert({
        org_id: dbIntent.reservation?.org_id || '',
        payment_intent_id: input.paymentIntentId,
        stripe_refund_id: refund.id,
        amount: refundAmount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status as RefundStatus,
        reason: input.reason || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (refundDbError) {
      console.error('Failed to save refund to database:', refundDbError);
      return { success: false, error: 'Failed to save refund' };
    }

    // Update reservation payment status
    if (dbIntent.reservation_id) {
      const refundedAmount = (dbIntent.amount === refundAmount / 100)
        ? dbIntent.amount
        : (input.amount || 0);

      await supabase
        .from('reservations')
        .update({
          payment_status: refundedAmount === dbIntent.amount ? 'refunded' : 'paid',
          refunded_amount: refundedAmount,
          refunded_at: new Date().toISOString(),
        })
        .eq('id', dbIntent.reservation_id);
    }

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    console.error('Failed to create refund:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create refund',
    };
  }
}

/**
 * Get refund status
 * @param refundId - Stripe refund ID
 * @returns Refund status
 */
export async function getRefundStatus(refundId: string): Promise<{
  success: boolean;
  status?: RefundStatus;
  amount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: refund, error } = await supabase
      .from('refunds')
      .select('status, amount')
      .eq('stripe_refund_id', refundId)
      .single();

    if (error || !refund) {
      return { success: false, error: 'Refund not found' };
    }

    return {
      success: true,
      status: refund.status as RefundStatus,
      amount: refund.amount,
    };
  } catch (error) {
    console.error('Failed to get refund status:', error);
    return {
      success: false,
      error: 'Failed to retrieve refund status',
    };
  }
}

/**
 * List refunds for a payment intent
 * @param paymentIntentId - Payment intent ID
 * @returns List of refunds
 */
export async function listRefunds(paymentIntentId: string): Promise<{
  success: boolean;
  refunds?: Array<{
    id: string;
    stripe_refund_id: string;
    amount: number;
    status: RefundStatus;
    reason: string | null;
    created_at: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('id, stripe_refund_id, amount, status, reason, created_at')
      .eq('payment_intent_id', paymentIntentId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: 'Failed to retrieve refunds' };
    }

    return {
      success: true,
      refunds: refunds as Array<{
        id: string;
        stripe_refund_id: string;
        amount: number;
        status: RefundStatus;
        reason: string | null;
        created_at: string;
      }>,
    };
  } catch (error) {
    console.error('Failed to list refunds:', error);
    return {
      success: false,
      error: 'Failed to list refunds',
    };
  }
}
