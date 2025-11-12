'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
});

type ActionResult = { success: true } | { error: string };

/**
 * Sign in existing user with magic link
 */
export async function signInWithMagicLink(
  formData: FormData
): Promise<ActionResult> {
  try {
    // Extract and validate email
    const email = formData.get('email') as string;
    const result = signInSchema.safeParse({ email });

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const supabase = await createClient();

    // Send magic link for existing users only
    const { error } = await supabase.auth.signInWithOtp({
      email: result.data.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      console.error('Sign in error:', error);

      // Provide user-friendly error messages
      if (error.message.includes('User not found')) {
        return { error: 'No account found with this email. Please sign up first.' };
      }

      return { error: error.message || 'Failed to send magic link' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected sign in error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Sign up new user with magic link
 */
export async function signUpWithMagicLink(
  formData: FormData
): Promise<ActionResult> {
  try {
    // Extract and validate form data
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const organizationName = formData.get('organizationName') as string;

    const result = signUpSchema.safeParse({ email, fullName, organizationName });

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const supabase = await createClient();

    // Send magic link and create user with metadata
    const { error } = await supabase.auth.signInWithOtp({
      email: result.data.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
        data: {
          full_name: result.data.fullName,
          organization_name: result.data.organizationName,
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);

      // Provide user-friendly error messages
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists. Please sign in instead.' };
      }

      return { error: error.message || 'Failed to send magic link' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected sign up error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Revalidate all pages to clear any cached user data
  revalidatePath('/', 'layout');

  // Redirect to login page
  redirect('/login');
}
