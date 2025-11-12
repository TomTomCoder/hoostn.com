import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Handle PKCE flow (preferred)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth-error?message=${encodeURIComponent(
          error.message || 'Failed to authenticate'
        )}`
      );
    }

    // Successful authentication, redirect to next URL
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // Handle legacy token hash flow (fallback for older magic links)
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'sms' | 'recovery',
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth-error?message=${encodeURIComponent(
          error.message || 'Failed to authenticate'
        )}`
      );
    }

    // Successful authentication, redirect to next URL
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // No valid authentication parameters provided
  return NextResponse.redirect(
    `${requestUrl.origin}/auth-error?message=${encodeURIComponent(
      'Invalid authentication callback. Missing required parameters.'
    )}`
  );
}
