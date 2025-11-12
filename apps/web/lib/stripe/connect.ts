/**
 * Stripe Connect Service
 * Functions for managing Stripe Connect accounts
 */

import { stripe, STRIPE_CONFIG } from './client';
import { createClient } from '@/lib/supabase/server';
import type { OnboardingLinkResponse, ConnectAccountStatus } from '@/types/stripe';

/**
 * Create a Stripe Connect Express account
 * @param orgId - Organization ID
 * @param email - Account email
 * @param country - Country code (default: FR)
 * @returns Stripe account ID
 */
export async function createConnectAccount(
  orgId: string,
  email: string,
  country: string = 'FR'
): Promise<{ accountId: string; error?: string }> {
  try {
    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: STRIPE_CONFIG.accountType,
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      metadata: {
        org_id: orgId,
      },
    });

    // Save to database
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('stripe_connected_accounts')
      .insert({
        org_id: orgId,
        stripe_account_id: account.id,
        account_type: STRIPE_CONFIG.accountType,
        email,
        country,
        default_currency: STRIPE_CONFIG.currency.toUpperCase(),
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted || false,
        capabilities: account.capabilities || {},
      });

    if (dbError) {
      console.error('Failed to save account to database:', dbError);
      return { accountId: account.id, error: 'Failed to save account' };
    }

    // Update organization with Stripe account ID
    await supabase
      .from('organizations')
      .update({ stripe_connected_account_id: account.id })
      .eq('id', orgId);

    return { accountId: account.id };
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error);
    return {
      accountId: '',
      error: error instanceof Error ? error.message : 'Failed to create account',
    };
  }
}

/**
 * Create Stripe Connect onboarding link
 * @param accountId - Stripe account ID
 * @returns Onboarding link URL
 */
export async function createOnboardingLink(
  accountId: string
): Promise<OnboardingLinkResponse | null> {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: STRIPE_CONFIG.refreshUrl,
      return_url: STRIPE_CONFIG.returnUrl,
      type: 'account_onboarding',
    });

    return {
      url: accountLink.url,
      expires_at: accountLink.expires_at,
    };
  } catch (error) {
    console.error('Failed to create onboarding link:', error);
    return null;
  }
}

/**
 * Create Stripe dashboard link for connected account
 * @param accountId - Stripe account ID
 * @returns Login link URL
 */
export async function createDashboardLink(accountId: string): Promise<string | null> {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
  } catch (error) {
    console.error('Failed to create dashboard link:', error);
    return null;
  }
}

/**
 * Sync Stripe account status with database
 * @param accountId - Stripe account ID
 * @returns Updated account status
 */
export async function syncAccountStatus(
  accountId: string
): Promise<ConnectAccountStatus | null> {
  try {
    // Fetch account from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    // Update database
    const supabase = await createClient();
    const { error: updateError } = await supabase
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
      .eq('stripe_account_id', accountId);

    if (updateError) {
      console.error('Failed to update account status in database:', updateError);
    }

    // Return status for UI
    return {
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements_due: account.requirements?.past_due || [],
      requirements_pending: account.requirements?.currently_due || [],
      has_requirements:
        (account.requirements?.past_due?.length || 0) > 0 ||
        (account.requirements?.currently_due?.length || 0) > 0,
      details_submitted: account.details_submitted || false,
      email: account.email || null,
    };
  } catch (error) {
    console.error('Failed to sync account status:', error);
    return null;
  }
}

/**
 * Get connected account status from database
 * @param orgId - Organization ID
 * @returns Account status or null if not connected
 */
export async function getConnectedAccountStatus(
  orgId: string
): Promise<ConnectAccountStatus | null> {
  try {
    const supabase = await createClient();

    // Get account from database
    const { data: account, error } = await supabase
      .from('stripe_connected_accounts')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error || !account) {
      return null;
    }

    // Sync with Stripe to get latest status
    return await syncAccountStatus(account.stripe_account_id);
  } catch (error) {
    console.error('Failed to get account status:', error);
    return null;
  }
}

/**
 * Check if organization has Stripe Connect enabled
 * @param orgId - Organization ID
 * @returns True if connected and charges enabled
 */
export async function isStripeConnected(orgId: string): Promise<boolean> {
  const status = await getConnectedAccountStatus(orgId);
  return status?.charges_enabled || false;
}
