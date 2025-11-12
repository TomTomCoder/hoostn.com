'use client';

import { useState, useEffect, useRef } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { sendMessage } from '@/lib/actions/chat';
import { processUserMessage } from '@/lib/actions/ai';
import { createHandoff } from '@/lib/actions/handoff';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import type { Thread } from '@/types/chat';
import { AlertCircle, User, Calendar, MapPin } from 'lucide-react';

interface ThreadViewProps {
  initialThread: Thread;
}

export function ThreadView({ initialThread }: ThreadViewProps) {
  const { messages, isConnected } = useRealtimeMessages(
    initialThread.id,
    initialThread.messages || []
  );
  const [isAITyping, setIsAITyping] = useState(false);
  const [thread, setThread] = useState(initialThread);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (body: string) => {
    try {
      // Send user message
      const { message: userMessage, error: sendError } = await sendMessage({
        thread_id: thread.id,
        author_type: 'guest',
        body,
        meta: {},
      });

      if (sendError || !userMessage) {
        throw new Error(sendError || 'Failed to send message');
      }

      // Trigger AI response
      setIsAITyping(true);
      const { success, escalated, error: aiError } = await processUserMessage(
        thread.id,
        body
      );

      setIsAITyping(false);

      if (!success) {
        console.error('AI processing failed:', aiError);
      }

      // Update thread status if escalated
      if (escalated) {
        setThread({ ...thread, status: 'escalated' });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsAITyping(false);
    }
  };

  const handleManualEscalate = async () => {
    const { handoff, error } = await createHandoff({
      thread_id: thread.id,
      reason: 'Manual escalation by owner',
    });

    if (!error && handoff) {
      setThread({ ...thread, status: 'escalated' });
    }
  };

  const reservation = thread.reservation;
  const isEscalated = thread.status === 'escalated';

  return (
    <div className="h-full flex">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Thread info banner */}
        <div className="bg-gray-50 border-b p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {reservation?.guest_name || 'Guest'}
                </h2>
                {reservation && (
                  <p className="text-sm text-gray-600 mt-1">
                    {reservation.guest_email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={isEscalated ? 'destructive' : 'default'}
                  className="capitalize"
                >
                  {thread.status}
                </Badge>
                {!isEscalated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualEscalate}
                  >
                    Escalate to Me
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Escalation alert */}
        {isEscalated && (
          <div className="container mx-auto px-4 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This conversation has been escalated and requires your attention.
                The AI detected low confidence or a complex request.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isAITyping && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="container mx-auto px-4 py-2">
            <Alert>
              <AlertDescription className="text-sm">
                Reconnecting to real-time updates...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Message input */}
        <MessageInput
          onSend={handleSendMessage}
          disabled={thread.status === 'closed'}
          placeholder={
            thread.status === 'closed'
              ? 'This conversation is closed'
              : 'Type your message...'
          }
        />
      </div>

      {/* Sidebar with reservation details */}
      {reservation && (
        <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Reservation Details</h3>

          <Card className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
              <div className="text-sm">
                <p className="font-medium">Check-in</p>
                <p className="text-gray-600">
                  {new Date(reservation.check_in).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
              <div className="text-sm">
                <p className="font-medium">Check-out</p>
                <p className="text-gray-600">
                  {new Date(reservation.check_out).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Guest</span>
                <span className="font-medium">{reservation.guest_name}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Status</span>
                <Badge variant="outline" className="capitalize">
                  {reservation.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Channel</span>
                <span className="capitalize">{reservation.channel}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
