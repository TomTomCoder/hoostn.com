/**
 * Stripe Connect Type Definitions
 * TypeScript interfaces for Stripe Connect integration
 */

/**
 * Stripe Connected Account
 */
export interface StripeConnectedAccount {
  id: string;
  org_id: string;
  stripe_account_id: string;
  account_type: 'express' | 'standard' | 'custom';
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements_due_by: string | null;
  requirements_past_due: string[] | null;
  requirements_pending: string[] | null;
  capabilities: Record<string, any>;
  details_submitted: boolean;
  email: string | null;
  country: string;
  default_currency: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Payment Intent
 */
export interface PaymentIntent {
  id: string;
  org_id: string;
  reservation_id: string | null;
  stripe_payment_intent_id: string;
  stripe_account_id: string | null;
  amount: number;
  platform_fee_amount: number;
  application_fee_amount: number;
  currency: string;
  status: PaymentIntentStatus;
  payment_method: string | null;
  capture_method: 'automatic' | 'manual';
  captured_at: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  client_secret: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Payment Intent Status
 */
export type PaymentIntentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'canceled'
  | 'failed';

/**
 * Refund
 */
export interface Refund {
  id: string;
  org_id: string;
  payment_intent_id: string;
  stripe_refund_id: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: string | null;
  failure_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Refund Status
 */
export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

/**
 * Transfer
 */
export interface Transfer {
  id: string;
  org_id: string;
  payment_intent_id: string | null;
  stripe_transfer_id: string;
  stripe_account_id: string | null;
  amount: number;
  currency: string;
  status: TransferStatus;
  destination_payment: string | null;
  reversed: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Transfer Status
 */
export type TransferStatus = 'pending' | 'paid' | 'failed' | 'canceled' | 'reversed';

/**
 * Invoice
 */
export interface Invoice {
  id: string;
  org_id: string;
  reservation_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  platform_fee: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice Status
 */
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

/**
 * Invoice Line Item
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
}

/**
 * Security Deposit
 */
export interface SecurityDeposit {
  id: string;
  org_id: string;
  reservation_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: SecurityDepositStatus;
  held_at: string;
  released_at: string | null;
  claimed_at: string | null;
  claim_amount: number | null;
  claim_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Security Deposit Status
 */
export type SecurityDepositStatus = 'held' | 'released' | 'claimed';

/**
 * Stripe Webhook Event
 */
export interface StripeWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  object_type: string | null;
  object_id: string | null;
  data: Record<string, any>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

/**
 * Payment Breakdown for display
 */
export interface PaymentBreakdown {
  accommodationTotal: number; // nights × nightlyRate
  cleaningFee: number;
  touristTax: number;
  subtotal: number; // accommodationTotal + cleaningFee + touristTax
  platformFee: number; // Platform commission (5% of subtotal)
  securityDeposit: number;
  total: number; // subtotal (platform fee is deducted from host payout, not added to guest total)
  hostPayout: number; // total - platformFee
  currency: string;
}

/**
 * Payment mode for reservations
 */
export type PaymentMode = 'full' | 'hold-72h';

/**
 * Connect Account Status for UI display
 */
export interface ConnectAccountStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements_due: string[];
  requirements_pending: string[];
  has_requirements: boolean;
  details_submitted: boolean;
  email: string | null;
}

/**
 * Stripe onboarding link response
 */
export interface OnboardingLinkResponse {
  url: string;
  expires_at: number;
}

/**
 * Create payment intent input
 */
export interface CreatePaymentIntentInput {
  reservationId: string;
  amount: number;
  platformFeeAmount: number;
  currency?: string;
  paymentMode?: PaymentMode;
  securityDepositAmount?: number;
  metadata?: Record<string, any>;
}

/**
 * Refund input
 */
export interface CreateRefundInput {
  paymentIntentId: string;
  amount?: number; // If not provided, full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, any>;
}

/**
 * Stripe configuration constants
 */
export interface StripeConfig {
  platformFeePercentage: number;
  currency: string;
  accountType: 'express' | 'standard';
  returnUrl: string;
  refreshUrl: string;
  webhookEndpoint: string;
}
