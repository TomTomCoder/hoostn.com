'use server';

// Chat Server Actions
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Thread,
  Message,
  CreateThreadInput,
  CreateMessageInput,
  ChatFilters,
  PaginatedThreads,
} from '@/types/chat';

/**
 * Create a new chat thread
 */
export async function createThread(
  input: CreateThreadInput
): Promise<{ thread: Thread | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Validate org access
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { thread: null, error: 'Not authenticated' };
    }

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert({
        org_id: input.org_id,
        reservation_id: input.reservation_id,
        channel: input.channel || 'direct',
        opened_by: input.opened_by,
        language: input.language || 'en',
        status: 'open',
      })
      .select()
      .single();

    if (threadError || !thread) {
      console.error('Failed to create thread:', threadError);
      return { thread: null, error: 'Failed to create thread' };
    }

    // Add initial message if provided
    if (input.initial_message) {
      await supabase.from('messages').insert({
        thread_id: thread.id,
        author_type: 'guest',
        body: input.initial_message,
        meta: {},
      });
    }

    revalidatePath('/dashboard/messages');
    return { thread, error: null };
  } catch (error) {
    console.error('Create thread error:', error);
    return { thread: null, error: 'Unexpected error creating thread' };
  }
}

/**
 * Get a single thread with messages and relations
 */
export async function getThread(
  threadId: string
): Promise<{ thread: Thread | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select(
        `
        *,
        reservation:reservations(
          id,
          guest_name,
          guest_email,
          check_in,
          check_out,
          lot_id
        ),
        messages:messages(
          *,
          author:users(id, full_name, email)
        ),
        handoffs:handoffs(
          *,
          assignee:users(id, full_name, email)
        )
      `
      )
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return { thread: null, error: 'Thread not found' };
    }

    // Sort messages by created_at
    if (thread.messages) {
      thread.messages.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return { thread, error: null };
  } catch (error) {
    console.error('Get thread error:', error);
    return { thread: null, error: 'Failed to load thread' };
  }
}

/**
 * Get list of threads with filters and pagination
 */
export async function getThreads(
  filters: ChatFilters,
  page = 1,
  limit = 20
): Promise<{ result: PaginatedThreads | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('threads')
      .select(
        `
        *,
        reservation:reservations(
          id,
          guest_name,
          guest_email,
          check_in,
          check_out
        ),
        messages:messages(*)
      `,
        { count: 'exact' }
      )
      .eq('org_id', filters.org_id);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.channel) {
      query = query.eq('channel', filters.channel);
    }

    if (filters.reservation_id) {
      query = query.eq('reservation_id', filters.reservation_id);
    }

    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: threads, error: threadsError, count } = await query;

    if (threadsError) {
      console.error('Get threads error:', threadsError);
      return { result: null, error: 'Failed to load threads' };
    }

    // Get latest message for each thread
    const threadsWithLatest = (threads || []).map((thread: any) => {
      const messages = thread.messages || [];
      const latest_message = messages.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        ...thread,
        latest_message,
        messages: undefined, // Remove to reduce payload
      };
    });

    return {
      result: {
        threads: threadsWithLatest,
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
      },
      error: null,
    };
  } catch (error) {
    console.error('Get threads error:', error);
    return { result: null, error: 'Failed to load threads' };
  }
}

/**
 * Send a message in a thread
 */
export async function sendMessage(
  input: CreateMessageInput
): Promise<{ message: Message | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_thread_id: input.thread_id,
    });

    if (rateLimitOk === false) {
      return { message: null, error: 'Rate limit exceeded. Please wait a moment.' };
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: input.thread_id,
        author_type: input.author_type,
        author_id: input.author_id,
        body: input.body,
        meta: input.meta || {},
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error('Failed to send message:', messageError);
      return { message: null, error: 'Failed to send message' };
    }

    revalidatePath(`/dashboard/messages/${input.thread_id}`);
    return { message, error: null };
  } catch (error) {
    console.error('Send message error:', error);
    return { message: null, error: 'Failed to send message' };
  }
}

/**
 * Close a thread
 */
export async function closeThread(
  threadId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('threads')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    if (updateError) {
      console.error('Failed to close thread:', updateError);
      return { success: false, error: 'Failed to close thread' };
    }

    revalidatePath('/dashboard/messages');
    revalidatePath(`/dashboard/messages/${threadId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Close thread error:', error);
    return { success: false, error: 'Failed to close thread' };
  }
}

/**
 * Reopen a closed thread
 */
export async function reopenThread(
  threadId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('threads')
      .update({
        status: 'open',
        closed_at: null,
      })
      .eq('id', threadId);

    if (updateError) {
      console.error('Failed to reopen thread:', updateError);
      return { success: false, error: 'Failed to reopen thread' };
    }

    revalidatePath('/dashboard/messages');
    revalidatePath(`/dashboard/messages/${threadId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Reopen thread error:', error);
    return { success: false, error: 'Failed to reopen thread' };
  }
}

/**
 * Search messages by text
 */
export async function searchMessages(
  orgId: string,
  searchTerm: string,
  limit = 50
): Promise<{ messages: Message[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: messages, error: searchError } = await supabase
      .from('messages')
      .select(
        `
        *,
        thread:threads!inner(org_id)
      `
      )
      .eq('thread.org_id', orgId)
      .textSearch('body', searchTerm)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (searchError) {
      console.error('Search error:', searchError);
      return { messages: [], error: 'Search failed' };
    }

    return { messages: messages || [], error: null };
  } catch (error) {
    console.error('Search messages error:', error);
    return { messages: [], error: 'Search failed' };
  }
}
