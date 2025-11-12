import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();

  // Sign out the user
  await supabase.auth.signOut();

  // Return success response (client will handle redirect)
  return NextResponse.json({ success: true });
}
