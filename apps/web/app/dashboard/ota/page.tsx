/**
 * OTA Dashboard Page
 * Main dashboard for managing OTA platform connections
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConnectionCard } from '@/components/ota/ConnectionCard';
import { SyncLogsTable } from '@/components/ota/SyncLogsTable';
import { ConflictResolver } from '@/components/ota/ConflictResolver';
import { getOTAConnections } from '@/lib/actions/ota-connections';
import { getSyncLogs, getConflicts, getOTAStats } from '@/lib/actions/ota-sync';

export const metadata = {
  title: 'OTA Integrations - Hoostn',
  description: 'Manage your OTA platform integrations',
};

export default async function OTADashboardPage() {
  // Fetch all data
  const [connectionsResult, syncLogsResult, conflictsResult, statsResult] =
    await Promise.all([
      getOTAConnections(),
      getSyncLogs(undefined, 20),
      getConflicts('unresolved'),
      getOTAStats(),
    ]);

  const connections = connectionsResult.success ? connectionsResult.data : [];
  const syncLogs = syncLogsResult.success ? syncLogsResult.data : [];
  const conflicts = conflictsResult.success ? conflictsResult.data : [];
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OTA Integrations</h1>
          <p className="text-gray-600 mt-1">
            Manage your online travel agency platform connections
          </p>
        </div>
        <Link href="/dashboard/ota/connections/new">
          <Button>Add Connection</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Connections</div>
            <div className="text-2xl font-bold mt-1">
              {stats.total_connections}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {stats.active_connections}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Errors</div>
            <div className="text-2xl font-bold mt-1 text-red-600">
              {stats.error_connections}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Unresolved Conflicts</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">
              {stats.unresolved_conflicts}
            </div>
          </Card>
        </div>
      )}

      {/* Unresolved Conflicts */}
      {conflicts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Unresolved Conflicts</h2>
          <ConflictResolver conflicts={conflicts} />
        </section>
      )}

      {/* Connections */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Your Connections</h2>
        {connections.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              No OTA connections configured yet
            </p>
            <Link href="/dashboard/ota/connections/new">
              <Button>Add Your First Connection</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <ConnectionCard key={connection.id} connection={connection} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Sync Logs */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Sync Activity</h2>
        <Card className="p-6">
          {syncLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No sync activity yet
            </p>
          ) : (
            <SyncLogsTable logs={syncLogs} />
          )}
        </Card>
      </section>

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">How to set up iCal sync</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>
            Go to your Airbnb listing calendar settings and copy the iCal
            export URL
          </li>
          <li>Click "Add Connection" above and paste the iCal URL</li>
          <li>
            Select how often you want to sync (recommended: every 30-60 minutes)
          </li>
          <li>
            The system will automatically import new bookings and detect
            conflicts
          </li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          <strong>Note:</strong> iCal sync is one-way (import only). For
          two-way sync, use the Booking.com API integration (coming soon).
        </p>
      </Card>
    </div>
  );
}
