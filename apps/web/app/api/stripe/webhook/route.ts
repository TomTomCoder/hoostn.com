/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment and account updates
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook handlers (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST handler for Stripe webhooks
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('No stripe-signature header found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`Received webhook: ${event.type} (${event.id})`);

  try {
    // Log webhook event
    await supabaseAdmin.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      object_type: event.data.object.object,
      object_id: event.data.object.id,
      data: event.data.object,
      processed: false,
    });

    // Process webhook based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'account.external_account.created':
      case 'account.external_account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Mark event as processed
    await supabaseAdmin
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Log error
    await supabaseAdmin
      .from('stripe_webhook_events')
      .update({
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: 0,
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  // Update payment intent in database
  await supabaseAdmin
    .from('payment_intents')
    .update({
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types?.[0] || null,
      captured_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Update reservation payment status
  const { data: dbIntent } = await supabaseAdmin
    .from('payment_intents')
    .select('reservation_id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (dbIntent?.reservation_id) {
    await supabaseAdmin
      .from('reservations')
      .update({
        payment_status: 'paid',
        payment_captured_at: new Date().toISOString(),
        status: 'confirmed', // Automatically confirm reservation when payment succeeds
      })
      .eq('id', dbIntent.reservation_id);

    console.log(`Updated reservation ${dbIntent.reservation_id} to paid and confirmed`);
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  // Update payment intent in database
  await supabaseAdmin
    .from('payment_intents')
    .update({
      status: 'failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Optionally update reservation status
  const { data: dbIntent } = await supabaseAdmin
    .from('payment_intents')
    .select('reservation_id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (dbIntent?.reservation_id) {
    // Keep reservation as pending, don't automatically cancel
    console.log(`Payment failed for reservation ${dbIntent.reservation_id}`);
  }
}

/**
 * Handle payment_intent.canceled event
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);

  await supabaseAdmin
    .from('payment_intents')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  // Get payment intent
  const paymentIntentId = charge.payment_intent as string;

  // Update refund status in database
  const { data: refunds } = await supabaseAdmin
    .from('refunds')
    .select('id')
    .eq('stripe_refund_id', charge.refunds?.data[0]?.id || '')
    .single();

  if (refunds) {
    await supabaseAdmin
      .from('refunds')
      .update({
        status: 'succeeded',
      })
      .eq('id', refunds.id);
  }

  // Update reservation if fully refunded
  if (charge.amount_refunded === charge.amount) {
    const { data: dbIntent } = await supabaseAdmin
      .from('payment_intents')
      .select('reservation_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (dbIntent?.reservation_id) {
      await supabaseAdmin
        .from('reservations')
        .update({
          payment_status: 'refunded',
          refunded_amount: charge.amount_refunded / 100,
          refunded_at: new Date().toISOString(),
        })
        .eq('id', dbIntent.reservation_id);

      console.log(`Refunded reservation ${dbIntent.reservation_id}`);
    }
  }
}

/**
 * Handle account.updated event
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Account updated: ${account.id}`);

  // Update connected account status
  await supabaseAdmin
    .from('stripe_connected_accounts')
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted || false,
      requirements_due_by: account.requirements?.current_deadline
        ? new Date(account.requirements.current_deadline * 1000).toISOString()
        : null,
      requirements_past_due: account.requirements?.past_due || [],
      requirements_pending: account.requirements?.currently_due || [],
      capabilities: account.capabilities || {},
      email: account.email || null,
    })
    .eq('stripe_account_id', account.id);

  console.log(`Updated account ${account.id} status`);
}
