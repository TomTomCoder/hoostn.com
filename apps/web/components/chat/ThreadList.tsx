'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Thread } from '@/types/chat';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface ThreadListProps {
  threads: Thread[];
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  escalated: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function ThreadList({ threads }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
        <p className="mt-1 text-sm text-gray-500">
          Guest conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => (
        <Link key={thread.id} href={`/dashboard/messages/${thread.id}`}>
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Guest info */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {thread.reservation?.guest_name || 'Guest'}
                  </p>
                  <Badge className={statusColors[thread.status]}>
                    {thread.status}
                  </Badge>
                  {thread.status === 'escalated' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Last message preview */}
                {thread.latest_message && (
                  <p className="text-sm text-gray-600 truncate">
                    {thread.latest_message.body}
                  </p>
                )}

                {/* Reservation info */}
                {thread.reservation && (
                  <p className="text-xs text-gray-500 mt-1">
                    Check-in: {new Date(thread.reservation.check_in).toLocaleDateString()}
                    {' • '}
                    Check-out: {new Date(thread.reservation.check_out).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="ml-4 text-right">
                <p className="text-xs text-gray-500">
                  {thread.last_message_at
                    ? formatDistanceToNow(new Date(thread.last_message_at), {
                        addSuffix: true,
                      })
                    : formatDistanceToNow(new Date(thread.created_at), {
                        addSuffix: true,
                      })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {thread.channel}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
