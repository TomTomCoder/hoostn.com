'use client';

/**
 * OTA Connection Card Component
 * Displays OTA connection status and actions
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { deleteOTAConnection } from '@/lib/actions/ota-connections';
import { triggerManualSync } from '@/lib/actions/ota-sync';
import type { OTAConnectionWithLot } from '@/types/ota';

interface ConnectionCardProps {
  connection: OTAConnectionWithLot;
  onUpdate?: () => void;
}

export function ConnectionCard({ connection, onUpdate }: ConnectionCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSync = async () => {
    setError(null);
    setSuccess(null);
    setIsSyncing(true);

    try {
      const result = await triggerManualSync(connection.id);

      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(
          `Sync complete: ${result.data.items_created} created, ${result.data.items_updated} updated`
        );
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      setError('Failed to sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteOTAConnection(connection.id);

      if (!result.success) {
        setError(result.error);
        setIsDeleting(false);
      } else {
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      setError('Failed to delete connection');
      setIsDeleting(false);
    }
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      airbnb_ical: 'Airbnb',
      booking_api: 'Booking.com',
      vrbo_ical: 'VRBO',
      expedia_ical: 'Expedia',
    };
    return labels[platform] || platform;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
      active: 'success',
      paused: 'warning',
      error: 'error',
      deleted: 'default',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">
              {getPlatformLabel(connection.platform)}
            </h3>
            {getStatusBadge(connection.status)}
          </div>

          {/* Lot Info */}
          <p className="text-sm text-gray-600 mb-4">
            Lot: <span className="font-medium">{connection.lot.title}</span>
          </p>

          {/* Sync Info */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Last sync:</span>
              <span className="font-medium">
                {formatDateTime(connection.last_sync_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Next sync:</span>
              <span className="font-medium">
                {formatDateTime(connection.next_sync_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Frequency:</span>
              <span className="font-medium">
                Every {connection.sync_frequency_minutes} minutes
              </span>
            </div>
          </div>

          {/* Error Display */}
          {connection.last_error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-semibold">Error:</span>{' '}
                {connection.last_error}
              </p>
              {connection.error_count > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Failed {connection.error_count} time(s)
                </p>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || connection.status !== 'active'}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
}
