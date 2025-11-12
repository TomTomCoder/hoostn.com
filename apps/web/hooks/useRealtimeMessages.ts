'use client';

// React hook for real-time message updates
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeToThread, unsubscribeFromChannel } from '@/lib/realtime/channels';
import type { Message } from '@/types/chat';

export function useRealtimeMessages(
  threadId: string,
  initialMessages: Message[] = []
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((msg) => msg.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
  }, []);

  useEffect(() => {
    if (!threadId) return;

    const channel = subscribeToThread(supabase, threadId, handleNewMessage);

    channel.on('system', {}, (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      setIsConnected(false);
      unsubscribeFromChannel(supabase, channel);
    };
  }, [threadId, supabase, handleNewMessage]);

  // Update messages when initialMessages change (e.g., after page load)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  return {
    messages,
    isConnected,
  };
}
