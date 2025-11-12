// Supabase Realtime Channels for Chat
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message, Thread } from '@/types/chat';

/**
 * Subscribe to new messages in a thread
 */
export function subscribeToThread(
  supabase: any,
  threadId: string,
  onMessage: (message: Message) => void,
  onThreadUpdate?: (thread: Partial<Thread>) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload: any) => {
        onMessage(payload.new as Message);
      }
    );

  // Also listen for thread updates (status changes, etc.)
  if (onThreadUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'threads',
        filter: `id=eq.${threadId}`,
      },
      (payload: any) => {
        onThreadUpdate(payload.new as Thread);
      }
    );
  }

  channel.subscribe();

  return channel;
}

/**
 * Subscribe to all threads for an organization
 */
export function subscribeToOrgThreads(
  supabase: any,
  orgId: string,
  onThreadUpdate: (thread: Thread) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`org-threads:${orgId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'threads',
        filter: `org_id=eq.${orgId}`,
      },
      (payload: any) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          onThreadUpdate(payload.new as Thread);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to new handoffs for support console
 */
export function subscribeToHandoffs(
  supabase: any,
  orgId: string,
  onHandoff: (handoff: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`handoffs:${orgId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'handoffs',
      },
      async (payload: any) => {
        // Fetch the full handoff with thread data
        const { data: handoff } = await supabase
          .from('handoffs')
          .select(
            `
            *,
            thread:threads!inner(
              *,
              reservation:reservations(guest_name, guest_email)
            )
          `
          )
          .eq('id', payload.new.id)
          .eq('thread.org_id', orgId)
          .single();

        if (handoff) {
          onHandoff(handoff);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeFromChannel(
  supabase: any,
  channel: RealtimeChannel
): Promise<void> {
  await supabase.removeChannel(channel);
}

/**
 * Send a typing indicator (presence)
 */
export function sendTypingIndicator(
  channel: RealtimeChannel,
  userId: string,
  isTyping: boolean
): void {
  channel.track({
    user_id: userId,
    is_typing: isTyping,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTyping(
  channel: RealtimeChannel,
  onTypingChange: (typingUsers: string[]) => void
): void {
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    const typingUsers = Object.values(state)
      .flat()
      .filter((presence: any) => presence.is_typing)
      .map((presence: any) => presence.user_id);

    onTypingChange(typingUsers);
  });
}
