'use server';

// Handoff Server Actions (Human-in-the-Loop)
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Handoff, CreateHandoffInput } from '@/types/chat';

/**
 * Create a handoff (escalation to human)
 */
export async function createHandoff(
  input: CreateHandoffInput
): Promise<{ handoff: Handoff | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Create handoff
    const { data: handoff, error: handoffError } = await supabase
      .from('handoffs')
      .insert({
        thread_id: input.thread_id,
        reason: input.reason,
        snapshot: input.snapshot || {},
      })
      .select()
      .single();

    if (handoffError || !handoff) {
      console.error('Failed to create handoff:', handoffError);
      return { handoff: null, error: 'Failed to create handoff' };
    }

    // Update thread status to escalated
    await supabase
      .from('threads')
      .update({ status: 'escalated' })
      .eq('id', input.thread_id);

    revalidatePath('/dashboard/support');
    revalidatePath(`/dashboard/messages/${input.thread_id}`);

    return { handoff, error: null };
  } catch (error) {
    console.error('Create handoff error:', error);
    return { handoff: null, error: 'Failed to create handoff' };
  }
}

/**
 * Assign a handoff to an agent
 */
export async function assignHandoff(
  handoffId: string,
  agentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('handoffs')
      .update({ assigned_to: agentId })
      .eq('id', handoffId);

    if (updateError) {
      console.error('Failed to assign handoff:', updateError);
      return { success: false, error: 'Failed to assign handoff' };
    }

    revalidatePath('/dashboard/support');
    return { success: true, error: null };
  } catch (error) {
    console.error('Assign handoff error:', error);
    return { success: false, error: 'Failed to assign handoff' };
  }
}

/**
 * Resolve a handoff
 */
export async function resolveHandoff(
  handoffId: string,
  outcome: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get handoff to find thread
    const { data: handoff } = await supabase
      .from('handoffs')
      .select('thread_id')
      .eq('id', handoffId)
      .single();

    if (!handoff) {
      return { success: false, error: 'Handoff not found' };
    }

    // Update handoff
    const { error: updateError } = await supabase
      .from('handoffs')
      .update({
        resolved_at: new Date().toISOString(),
        outcome,
      })
      .eq('id', handoffId);

    if (updateError) {
      console.error('Failed to resolve handoff:', updateError);
      return { success: false, error: 'Failed to resolve handoff' };
    }

    // Update thread status back to open
    await supabase
      .from('threads')
      .update({ status: 'open' })
      .eq('id', handoff.thread_id);

    revalidatePath('/dashboard/support');
    revalidatePath(`/dashboard/messages/${handoff.thread_id}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Resolve handoff error:', error);
    return { success: false, error: 'Failed to resolve handoff' };
  }
}

/**
 * Get handoffs with filters
 */
export async function getHandoffs(
  orgId: string,
  status: 'pending' | 'assigned' | 'resolved' | 'all' = 'all'
): Promise<{ handoffs: Handoff[]; error: string | null }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('handoffs')
      .select(
        `
        *,
        thread:threads!inner(
          *,
          reservation:reservations(
            id,
            guest_name,
            guest_email
          )
        ),
        assignee:users(id, full_name, email)
      `
      )
      .eq('thread.org_id', orgId)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status === 'pending') {
      query = query.is('assigned_to', null).is('resolved_at', null);
    } else if (status === 'assigned') {
      query = query.not('assigned_to', 'is', null).is('resolved_at', null);
    } else if (status === 'resolved') {
      query = query.not('resolved_at', 'is', null);
    }

    const { data: handoffs, error: handoffsError } = await query;

    if (handoffsError) {
      console.error('Get handoffs error:', handoffsError);
      return { handoffs: [], error: 'Failed to load handoffs' };
    }

    return { handoffs: handoffs || [], error: null };
  } catch (error) {
    console.error('Get handoffs error:', error);
    return { handoffs: [], error: 'Failed to load handoffs' };
  }
}

/**
 * Get handoff by ID
 */
export async function getHandoff(
  handoffId: string
): Promise<{ handoff: Handoff | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: handoff, error: handoffError } = await supabase
      .from('handoffs')
      .select(
        `
        *,
        thread:threads(
          *,
          reservation:reservations(
            id,
            guest_name,
            guest_email
          ),
          messages:messages(*)
        ),
        assignee:users(id, full_name, email)
      `
      )
      .eq('id', handoffId)
      .single();

    if (handoffError || !handoff) {
      return { handoff: null, error: 'Handoff not found' };
    }

    return { handoff, error: null };
  } catch (error) {
    console.error('Get handoff error:', error);
    return { handoff: null, error: 'Failed to load handoff' };
  }
}

/**
 * Assign handoff to self (current user)
 */
export async function assignHandoffToSelf(
  handoffId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: 'Not authenticated' };
    }

    return await assignHandoff(handoffId, user.user.id);
  } catch (error) {
    console.error('Assign to self error:', error);
    return { success: false, error: 'Failed to assign handoff' };
  }
}
