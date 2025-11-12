/**
 * Stripe Connect Onboarding API
 * Creates onboarding links for Stripe Connect accounts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOnboardingLink } from '@/lib/stripe/connect';

/**
 * POST handler to create onboarding link
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get Stripe account ID
    const { data: account, error: accountError } = await supabase
      .from('stripe_connected_accounts')
      .select('stripe_account_id')
      .eq('org_id', userData.org_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Stripe Connect account not found' },
        { status: 404 }
      );
    }

    // Create onboarding link
    const onboardingLink = await createOnboardingLink(account.stripe_account_id);

    if (!onboardingLink) {
      return NextResponse.json(
        { error: 'Failed to create onboarding link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: onboardingLink.url,
      expires_at: onboardingLink.expires_at,
    });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
