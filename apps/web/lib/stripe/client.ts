/**
 * Stripe Client Initialization
 * Server-side Stripe client for payment processing
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

/**
 * Stripe client instance (server-side only)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'Hoostn',
    version: '1.0.0',
  },
});

/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
  // Platform fee percentage (5%)
  platformFeePercentage: 5.0,

  // Default currency
  currency: 'eur' as const,

  // Account type for Stripe Connect
  accountType: 'express' as const,

  // Base URL for redirects (will be set from environment)
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Return URL after Stripe Connect onboarding
  get returnUrl() {
    return `${this.baseUrl}/dashboard/settings/payments/connect/return`;
  },

  // Refresh URL if user needs to complete onboarding again
  get refreshUrl() {
    return `${this.baseUrl}/dashboard/settings/payments/connect/refresh`;
  },

  // Webhook endpoint
  get webhookEndpoint() {
    return `${this.baseUrl}/api/stripe/webhook`;
  },

  // Payment hold duration for manual capture (in hours)
  paymentHoldDuration: 72,

  // Webhook secret
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
} as const;

/**
 * Calculate platform fee amount
 * @param amount - Total amount in cents
 * @param feePercentage - Fee percentage (default 5%)
 * @returns Platform fee in cents
 */
export function calculatePlatformFee(
  amount: number,
  feePercentage: number = STRIPE_CONFIG.platformFeePercentage
): number {
  return Math.round((amount * feePercentage) / 100);
}

/**
 * Convert euros to cents (Stripe uses smallest currency unit)
 * @param euros - Amount in euros
 * @returns Amount in cents
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convert cents to euros
 * @param cents - Amount in cents
 * @returns Amount in euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}
