'use server';

// AI Server Actions
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateAIResponse } from '@/lib/ai/orchestrator';
import type { ChatStats } from '@/types/chat';

/**
 * Process a user message and generate AI response
 */
export async function processUserMessage(
  threadId: string,
  userMessage: string
): Promise<{
  success: boolean;
  aiMessage?: string;
  confidence?: number;
  escalated?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Generate AI response
    const result = await generateAIResponse(threadId, userMessage);

    if (result.error && !result.content) {
      return {
        success: false,
        error: 'AI service unavailable',
      };
    }

    // Store AI response as a message
    const { data: aiMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        author_type: 'ai',
        body: result.content,
        meta: {
          confidence: result.confidence,
          ai_trace_id: result.ai_trace_id,
          intent: result.intent,
          provider: result.provider,
        },
      })
      .select()
      .single();

    if (messageError) {
      console.error('Failed to store AI message:', messageError);
      return {
        success: false,
        error: 'Failed to store AI response',
      };
    }

    // If escalation is needed, update thread status and create handoff
    if (result.should_escalate) {
      await supabase
        .from('threads')
        .update({ status: 'escalated' })
        .eq('id', threadId);

      await supabase.from('handoffs').insert({
        thread_id: threadId,
        reason: result.escalation_reason || 'Low confidence response',
        snapshot: {
          last_message: userMessage,
          ai_response: result.content,
          confidence: result.confidence,
        },
      });
    }

    revalidatePath(`/dashboard/messages/${threadId}`);

    return {
      success: true,
      aiMessage: result.content,
      confidence: result.confidence,
      escalated: result.should_escalate,
    };
  } catch (error) {
    console.error('Process user message error:', error);
    return {
      success: false,
      error: 'Failed to process message',
    };
  }
}

/**
 * Get AI statistics for an organization
 */
export async function getAIStats(
  orgId: string
): Promise<{ stats: ChatStats | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get thread stats
    const { data: threadStats } = await supabase
      .from('thread_stats')
      .select('*')
      .eq('org_id', orgId)
      .single();

    // Get AI performance stats
    const { data: aiPerf } = await supabase
      .from('ai_performance')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!threadStats && !aiPerf) {
      return { stats: null, error: 'No stats available' };
    }

    const stats: ChatStats = {
      open_threads: threadStats?.open_threads || 0,
      escalated_threads: threadStats?.escalated_threads || 0,
      closed_threads: threadStats?.closed_threads || 0,
      avg_resolution_hours: threadStats?.avg_resolution_hours || 0,
      total_threads: threadStats?.total_threads || 0,
      total_ai_responses: aiPerf?.total_ai_responses || 0,
      avg_confidence: aiPerf?.avg_confidence || 0,
      avg_latency_ms: aiPerf?.avg_latency_ms || 0,
      total_tokens: aiPerf?.total_tokens || 0,
      low_confidence_count: aiPerf?.low_confidence_count || 0,
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Get AI stats error:', error);
    return { stats: null, error: 'Failed to load stats' };
  }
}

/**
 * Manually trigger AI response regeneration
 */
export async function regenerateAIResponse(
  threadId: string,
  messageId: string
): Promise<{ success: boolean; newMessage?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the message to regenerate from
    const { data: message } = await supabase
      .from('messages')
      .select('body')
      .eq('id', messageId)
      .single();

    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Generate new response
    const result = await generateAIResponse(threadId, message.body);

    // Store new AI message
    const { error: insertError } = await supabase.from('messages').insert({
      thread_id: threadId,
      author_type: 'ai',
      body: result.content,
      meta: {
        confidence: result.confidence,
        ai_trace_id: result.ai_trace_id,
        intent: result.intent,
        provider: result.provider,
        regenerated: true,
      },
    });

    if (insertError) {
      return { success: false, error: 'Failed to store regenerated message' };
    }

    revalidatePath(`/dashboard/messages/${threadId}`);

    return {
      success: true,
      newMessage: result.content,
    };
  } catch (error) {
    console.error('Regenerate AI response error:', error);
    return { success: false, error: 'Failed to regenerate response' };
  }
}

/**
 * Get AI traces for a thread (for debugging)
 */
export async function getAITraces(threadId: string) {
  try {
    const supabase = await createClient();

    const { data: traces, error } = await supabase
      .from('ai_traces')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get AI traces error:', error);
      return { traces: [], error: 'Failed to load traces' };
    }

    return { traces: traces || [], error: null };
  } catch (error) {
    console.error('Get AI traces error:', error);
    return { traces: [], error: 'Failed to load traces' };
  }
}
