'use client';

import { formatDistanceToNow } from 'date-fns';
import type { Message, AuthorType } from '@/types/chat';
import { ConfidenceBadge } from './ConfidenceBadge';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

const authorColors: Record<AuthorType, string> = {
  guest: 'bg-blue-100 text-blue-900 border-blue-200',
  owner: 'bg-purple-100 text-purple-900 border-purple-200',
  agent: 'bg-green-100 text-green-900 border-green-200',
  ai: 'bg-gray-100 text-gray-900 border-gray-200',
};

const authorLabels: Record<AuthorType, string> = {
  guest: 'Guest',
  owner: 'Owner',
  agent: 'Agent',
  ai: 'AI Assistant',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isGuest = message.author_type === 'guest';
  const confidence = message.meta?.confidence;
  const isAutoGreeting = message.meta?.auto_greeting;

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isGuest ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg border p-3',
          authorColors[message.author_type]
        )}
      >
        {/* Author and time */}
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-xs font-semibold">
            {authorLabels[message.author_type]}
          </span>
          <span className="text-xs opacity-70">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Message body */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.body}
        </div>

        {/* Confidence badge for AI messages */}
        {message.author_type === 'ai' && confidence !== undefined && !isAutoGreeting && (
          <div className="mt-2 pt-2 border-t border-current/20">
            <ConfidenceBadge confidence={confidence} />
          </div>
        )}

        {/* Auto-greeting indicator */}
        {isAutoGreeting && (
          <div className="mt-2 text-xs opacity-60 italic">
            Automated greeting
          </div>
        )}
      </div>
    </div>
  );
}
