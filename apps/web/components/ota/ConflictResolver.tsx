'use client';

/**
 * OTA Conflict Resolver Component
 * Displays and resolves booking conflicts
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveConflict, ignoreConflict } from '@/lib/actions/ota-sync';
import type { OTAConflictWithDetails, ResolutionAction } from '@/types/ota';

interface ConflictResolverProps {
  conflicts: OTAConflictWithDetails[];
  onUpdate?: () => void;
}

export function ConflictResolver({
  conflicts,
  onUpdate,
}: ConflictResolverProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (
    conflictId: string,
    action: ResolutionAction,
    notes?: string
  ) => {
    setError(null);
    setResolvingId(conflictId);

    try {
      const result = await resolveConflict(conflictId, {
        resolution_action: action,
        notes,
      });

      if (!result.success) {
        setError(result.error);
      } else {
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      setError('Failed to resolve conflict');
    } finally {
      setResolvingId(null);
    }
  };

  const handleIgnore = async (conflictId: string) => {
    if (!confirm('Are you sure you want to ignore this conflict?')) {
      return;
    }

    setError(null);
    setResolvingId(conflictId);

    try {
      const result = await ignoreConflict(conflictId);

      if (!result.success) {
        setError(result.error);
      } else {
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      setError('Failed to ignore conflict');
    } finally {
      setResolvingId(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    };

    return (
      <Badge variant={variants[severity] || 'default'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getConflictTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      double_booking: 'Double Booking',
      date_overlap: 'Date Overlap',
      cancellation_sync: 'Cancellation Sync',
      price_mismatch: 'Price Mismatch',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No unresolved conflicts
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {conflicts.map((conflict) => (
        <Card key={conflict.id} className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">
                  {getConflictTypeLabel(conflict.conflict_type)}
                </h3>
                {getSeverityBadge(conflict.severity)}
              </div>
              <p className="text-sm text-gray-600">
                Lot: <span className="font-medium">{conflict.lot.title}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Detected: {formatDateTime(conflict.detected_at)}
              </p>
            </div>
          </div>

          {/* Conflict Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Local Reservation */}
            {conflict.local_reservation && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                  Local Reservation
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-blue-700">Guest:</span>{' '}
                    {conflict.local_reservation.guest_name}
                  </p>
                  <p>
                    <span className="text-blue-700">Check-in:</span>{' '}
                    {formatDate(conflict.local_reservation.check_in)}
                  </p>
                  <p>
                    <span className="text-blue-700">Check-out:</span>{' '}
                    {formatDate(conflict.local_reservation.check_out)}
                  </p>
                  {conflict.local_reservation.total_price > 0 && (
                    <p>
                      <span className="text-blue-700">Price:</span> €
                      {conflict.local_reservation.total_price}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Remote Booking */}
            {conflict.conflict_data.remote_dates && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-sm text-orange-900 mb-2">
                  Remote Booking (
                  {conflict.connection.platform.replace('_', ' ')})
                </h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-orange-700">Booking ID:</span>{' '}
                    {conflict.remote_booking_id}
                  </p>
                  <p>
                    <span className="text-orange-700">Check-in:</span>{' '}
                    {formatDate(conflict.conflict_data.remote_dates.check_in)}
                  </p>
                  <p>
                    <span className="text-orange-700">Check-out:</span>{' '}
                    {formatDate(conflict.conflict_data.remote_dates.check_out)}
                  </p>
                  {conflict.conflict_data.remote_guest_name && (
                    <p>
                      <span className="text-orange-700">Guest:</span>{' '}
                      {conflict.conflict_data.remote_guest_name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {conflict.conflict_data.description && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {conflict.conflict_data.description}
              </p>
            </div>
          )}

          {/* Resolution Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleResolve(
                  conflict.id,
                  'keep_local',
                  'Keeping local reservation'
                )
              }
              disabled={resolvingId === conflict.id}
            >
              Keep Local
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleResolve(
                  conflict.id,
                  'keep_remote',
                  'Keeping remote booking, cancelled local'
                )
              }
              disabled={resolvingId === conflict.id}
            >
              Keep Remote
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleResolve(
                  conflict.id,
                  'manual_merge',
                  'Manually merged bookings'
                )
              }
              disabled={resolvingId === conflict.id}
            >
              Manual Merge
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleIgnore(conflict.id)}
              disabled={resolvingId === conflict.id}
            >
              Ignore
            </Button>
          </div>

          {resolvingId === conflict.id && (
            <p className="mt-2 text-sm text-gray-500">Resolving...</p>
          )}
        </Card>
      ))}
    </div>
  );
}
