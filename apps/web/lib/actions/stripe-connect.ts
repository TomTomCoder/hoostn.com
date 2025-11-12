'use server';

/**
 * Stripe Connect Server Actions
 * Server-side actions for managing Stripe Connect accounts
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  createConnectAccount,
  createOnboardingLink,
  createDashboardLink,
  getConnectedAccountStatus,
} from '@/lib/stripe/connect';
import type { ActionResult } from './reservations';
import type { ConnectAccountStatus, OnboardingLinkResponse } from '@/types/stripe';

/**
 * Get current user and organization ID
 */
async function getUserAndOrg(): Promise<{
  userId: string;
  orgId: string;
  email: string;
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
    .select('org_id, email')
    .eq('id', user.id)
    .single();

  if (error || !userData?.org_id) {
    console.error('Failed to get user org_id:', error);
    return null;
  }

  return {
    userId: user.id,
    orgId: userData.org_id,
    email: userData.email,
  };
}

/**
 * Initialize Stripe Connect for an organization
 * Creates a Stripe Connect account and returns onboarding link
 */
export async function initializeStripeConnect(): Promise<
  ActionResult<{ onboardingUrl: string }>
> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Check if organization already has a Stripe account
    const { data: existingAccount } = await supabase
      .from('stripe_connected_accounts')
      .select('stripe_account_id')
      .eq('org_id', auth.orgId)
      .single();

    let accountId: string;

    if (existingAccount) {
      // Use existing account
      accountId = existingAccount.stripe_account_id;
    } else {
      // Create new account
      const result = await createConnectAccount(auth.orgId, auth.email);
      if (result.error || !result.accountId) {
        return { success: false, error: result.error || 'Failed to create account' };
      }
      accountId = result.accountId;
    }

    // Create onboarding link
    const onboardingLink = await createOnboardingLink(accountId);
    if (!onboardingLink) {
      return { success: false, error: 'Failed to create onboarding link' };
    }

    revalidatePath('/dashboard/settings/payments');

    return {
      success: true,
      data: { onboardingUrl: onboardingLink.url },
    };
  } catch (error) {
    console.error('Failed to initialize Stripe Connect:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get connected account status for current organization
 */
export async function getConnectedAccountStatusAction(): Promise<
  ActionResult<ConnectAccountStatus>
> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const status = await getConnectedAccountStatus(auth.orgId);
    if (!status) {
      return {
        success: true,
        data: {
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          requirements_due: [],
          requirements_pending: [],
          has_requirements: false,
          details_submitted: false,
          email: null,
        },
      };
    }

    return { success: true, data: status };
  } catch (error) {
    console.error('Failed to get account status:', error);
    return { success: false, error: 'Failed to retrieve account status' };
  }
}

/**
 * Get Stripe dashboard link for connected account
 */
export async function getStripeDashboardLink(): Promise<ActionResult<{ url: string }>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get Stripe account ID
    const { data: account, error } = await supabase
      .from('stripe_connected_accounts')
      .select('stripe_account_id')
      .eq('org_id', auth.orgId)
      .single();

    if (error || !account) {
      return { success: false, error: 'Stripe Connect not configured' };
    }

    // Create dashboard link
    const url = await createDashboardLink(account.stripe_account_id);
    if (!url) {
      return { success: false, error: 'Failed to create dashboard link' };
    }

    return { success: true, data: { url } };
  } catch (error) {
    console.error('Failed to get dashboard link:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update platform fee percentage for organization
 */
export async function updatePlatformFee(
  feePercentage: number
): Promise<ActionResult<{ updated: boolean }>> {
  try {
    const auth = await getUserAndOrg();
    if (!auth) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate fee percentage (0-100)
    if (feePercentage < 0 || feePercentage > 100) {
      return { success: false, error: 'Fee percentage must be between 0 and 100' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('organizations')
      .update({ platform_fee_percentage: feePercentage })
      .eq('id', auth.orgId);

    if (error) {
      console.error('Failed to update platform fee:', error);
      return { success: false, error: 'Failed to update platform fee' };
    }

    revalidatePath('/dashboard/settings/payments');

    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Failed to update platform fee:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
