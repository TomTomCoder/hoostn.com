'use client';

/**
 * OTA Sync Logs Table Component
 * Displays recent sync operation logs
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { OTASyncLogWithConnection } from '@/types/ota';

interface SyncLogsTableProps {
  logs: OTASyncLogWithConnection[];
}

export function SyncLogsTable({ logs }: SyncLogsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
      success: 'success',
      partial_success: 'warning',
      error: 'error',
    };

    const labels: Record<string, string> = {
      success: 'Success',
      partial_success: 'Partial',
      error: 'Error',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'In progress...';

    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    const durationSec = Math.round(durationMs / 1000);

    if (durationSec < 60) {
      return `${durationSec}s`;
    }

    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sync logs available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Time
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Platform
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Type
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Status
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Processed
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Created
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Updated
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Failed
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Duration
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4 text-sm">
                {formatDateTime(log.started_at)}
              </td>
              <td className="py-3 px-4 text-sm">
                {getPlatformLabel(log.connection.platform)}
              </td>
              <td className="py-3 px-4 text-sm capitalize">
                {log.sync_type}
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(log.status)}
              </td>
              <td className="py-3 px-4 text-sm text-right">
                {log.items_processed}
              </td>
              <td className="py-3 px-4 text-sm text-right text-green-600 font-medium">
                {log.items_created}
              </td>
              <td className="py-3 px-4 text-sm text-right text-blue-600 font-medium">
                {log.items_updated}
              </td>
              <td className="py-3 px-4 text-sm text-right text-red-600 font-medium">
                {log.items_failed}
              </td>
              <td className="py-3 px-4 text-sm text-right text-gray-500">
                {formatDuration(log.started_at, log.completed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
