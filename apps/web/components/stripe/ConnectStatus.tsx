'use client';

/**
 * Stripe Connect Status Display
 * Shows the current status of Stripe Connect integration
 */

import { useEffect, useState } from 'react';
import {
  getConnectedAccountStatusAction,
  getStripeDashboardLink,
} from '@/lib/actions/stripe-connect';
import type { ConnectAccountStatus } from '@/types/stripe';

interface ConnectStatusProps {
  className?: string;
}

export function ConnectStatus({ className }: ConnectStatusProps) {
  const [status, setStatus] = useState<ConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getConnectedAccountStatusAction();

      if (!result.success) {
        setError(result.error || 'Failed to load status');
        setLoading(false);
        return;
      }

      setStatus(result.data);
    } catch (err) {
      console.error('Error loading status:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardClick = async () => {
    setDashboardLoading(true);

    try {
      const result = await getStripeDashboardLink();

      if (!result.success) {
        alert(result.error || 'Failed to open dashboard');
        setDashboardLoading(false);
        return;
      }

      window.open(result.data.url, '_blank');
    } catch (err) {
      console.error('Error opening dashboard:', err);
      alert('Failed to open Stripe dashboard');
    } finally {
      setDashboardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg border ${className || ''}`}>
        <p className="text-gray-600">Loading Stripe Connect status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-red-200 ${className || ''}`}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadStatus}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className={`p-6 bg-white rounded-lg border ${className || ''}`}>
        <h3 className="text-lg font-semibold mb-2">Stripe Connect Not Connected</h3>
        <p className="text-gray-600">
          Connect your Stripe account to start accepting payments.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg border ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stripe Connect Status</h3>
        {status.charges_enabled && (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-gray-600">Charges</span>
          <span
            className={`font-medium ${status.charges_enabled ? 'text-green-600' : 'text-yellow-600'}`}
          >
            {status.charges_enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-gray-600">Payouts</span>
          <span
            className={`font-medium ${status.payouts_enabled ? 'text-green-600' : 'text-yellow-600'}`}
          >
            {status.payouts_enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {status.email && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Account Email</span>
            <span className="font-medium text-gray-900">{status.email}</span>
          </div>
        )}

        {status.has_requirements && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">
              Action Required
            </h4>
            {status.requirements_due.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-yellow-800 font-medium">Past Due:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {status.requirements_due.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {status.requirements_pending.length > 0 && (
              <div>
                <p className="text-sm text-yellow-800 font-medium">Pending:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {status.requirements_pending.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {status.charges_enabled && (
          <button
            onClick={handleDashboardClick}
            disabled={dashboardLoading}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {dashboardLoading ? 'Opening...' : 'Open Stripe Dashboard'}
          </button>
        )}
      </div>
    </div>
  );
}
