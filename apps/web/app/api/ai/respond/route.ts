import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processUserMessage } from '@/lib/actions/ai';

/**
 * POST /api/ai/respond
 * Generate AI response for a user message
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

    // Parse body
    const body = await request.json();
    const { thread_id, message } = body;

    if (!thread_id || !message) {
      return NextResponse.json(
        { error: 'thread_id and message are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this thread
    const { data: thread } = await supabase
      .from('threads')
      .select('org_id')
      .eq('id', thread_id)
      .single();

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Check user's org matches thread's org
    const { data: userProfile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userData.user.id)
      .single();

    if (userProfile?.org_id !== thread.org_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Process message and generate AI response
    const result = await processUserMessage(thread_id, message);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: result.aiMessage,
      confidence: result.confidence,
      escalated: result.escalated,
    });
  } catch (error) {
    console.error('POST /api/ai/respond error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
