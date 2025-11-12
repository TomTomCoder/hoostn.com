import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createThread, getThreads } from '@/lib/actions/chat';
import type { CreateThreadInput, ChatFilters } from '@/types/chat';

/**
 * GET /api/chat/thread
 * List threads for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's org
    const { data: userProfile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userData.user.id)
      .single();

    if (!userProfile?.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters: ChatFilters = {
      org_id: userProfile.org_id,
      status: status as any,
    };

    // Fetch threads
    const { result, error } = await getThreads(filters, page, limit);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/chat/thread error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/thread
 * Create a new thread
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's org
    const { data: userProfile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userData.user.id)
      .single();

    if (!userProfile?.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json();
    const input: CreateThreadInput = {
      org_id: userProfile.org_id,
      reservation_id: body.reservation_id,
      channel: body.channel || 'direct',
      opened_by: body.opened_by || 'owner',
      language: body.language || 'en',
      initial_message: body.initial_message,
    };

    // Create thread
    const { thread, error } = await createThread(input);

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error('POST /api/chat/thread error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
