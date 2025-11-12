'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Handoff } from '@/types/chat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { assignHandoffToSelf, resolveHandoff } from '@/lib/actions/handoff';
import { AlertCircle, User, Calendar, MessageSquare, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface HandoffListProps {
  handoffs: Handoff[];
}

function HandoffCard({ handoff }: { handoff: Handoff }) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [localHandoff, setLocalHandoff] = useState(handoff);

  const isPending = !localHandoff.assigned_to && !localHandoff.resolved_at;
  const isAssigned = localHandoff.assigned_to && !localHandoff.resolved_at;
  const isResolved = !!localHandoff.resolved_at;

  const handleAssignToSelf = async () => {
    setIsAssigning(true);
    const { success } = await assignHandoffToSelf(localHandoff.id);
    if (success) {
      // Update local state (in production, you'd refresh or use optimistic updates)
      window.location.reload();
    }
    setIsAssigning(false);
  };

  const handleResolve = async () => {
    const outcome = prompt('Enter resolution outcome:');
    if (!outcome) return;

    setIsResolving(true);
    const { success } = await resolveHandoff(localHandoff.id, outcome);
    if (success) {
      window.location.reload();
    }
    setIsResolving(false);
  };

  return (
    <Card className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Status and reason */}
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={
                isResolved ? 'default' : isPending ? 'destructive' : 'secondary'
              }
            >
              {isResolved ? 'Resolved' : isPending ? 'Pending' : 'Assigned'}
            </Badge>
            <span className="text-sm font-medium text-gray-700">
              {localHandoff.reason}
            </span>
          </div>

          {/* Thread and guest info */}
          {localHandoff.thread && (
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {(localHandoff.thread as any).reservation?.guest_name || 'Guest'}
                </span>
              </div>
              {(localHandoff.thread as any).reservation && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Check-in:{' '}
                    {new Date(
                      (localHandoff.thread as any).reservation.check_in
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Assignee */}
          {localHandoff.assignee && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Assigned to:</span>{' '}
              {localHandoff.assignee.full_name || localHandoff.assignee.email}
            </div>
          )}

          {/* Outcome */}
          {localHandoff.outcome && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Outcome:</span> {localHandoff.outcome}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            {isResolved
              ? `Resolved ${formatDistanceToNow(new Date(localHandoff.resolved_at!), { addSuffix: true })}`
              : `Created ${formatDistanceToNow(new Date(localHandoff.created_at), { addSuffix: true })}`}
          </div>
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/dashboard/messages/${localHandoff.thread_id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              View Thread
            </Link>
          </Button>

          {isPending && (
            <Button
              size="sm"
              onClick={handleAssignToSelf}
              disabled={isAssigning}
            >
              {isAssigning ? 'Assigning...' : 'Assign to Me'}
            </Button>
          )}

          {isAssigned && (
            <Button
              size="sm"
              onClick={handleResolve}
              disabled={isResolving}
              variant="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isResolving ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function HandoffList({ handoffs }: HandoffListProps) {
  if (handoffs.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No escalations</h3>
        <p className="mt-1 text-sm text-gray-500">
          All conversations are being handled by AI or are resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {handoffs.map((handoff) => (
        <HandoffCard key={handoff.id} handoff={handoff} />
      ))}
    </div>
  );
}
