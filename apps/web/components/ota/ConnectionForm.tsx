'use client';

/**
 * OTA Connection Form Component
 * Form to create/edit OTA platform connections
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOTAConnection } from '@/lib/actions/ota-connections';
import type { OTAPlatform, CreateOTAConnectionInput } from '@/types/ota';

interface ConnectionFormProps {
  lots: Array<{ id: string; title: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ConnectionForm({
  lots,
  onSuccess,
  onCancel,
}: ConnectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    lot_id: string;
    platform: OTAPlatform;
    import_url: string;
    sync_frequency_minutes: number;
  }>({
    lot_id: '',
    platform: 'airbnb_ical',
    import_url: '',
    sync_frequency_minutes: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.lot_id) {
        setError('Please select a lot');
        setIsSubmitting(false);
        return;
      }

      if (!formData.import_url) {
        setError('Please enter the iCal feed URL');
        setIsSubmitting(false);
        return;
      }

      // Create connection
      const input: CreateOTAConnectionInput = {
        lot_id: formData.lot_id,
        platform: formData.platform,
        config: {
          import_url: formData.import_url,
        },
        sync_frequency_minutes: formData.sync_frequency_minutes,
      };

      const result = await createOTAConnection(input);

      if (!result.success) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating connection:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lot Selection */}
      <div>
        <Label htmlFor="lot_id">Select Lot</Label>
        <select
          id="lot_id"
          value={formData.lot_id}
          onChange={(e) =>
            setFormData({ ...formData, lot_id: e.target.value })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">-- Select a lot --</option>
          {lots.map((lot) => (
            <option key={lot.id} value={lot.id}>
              {lot.title}
            </option>
          ))}
        </select>
      </div>

      {/* Platform Selection */}
      <div>
        <Label htmlFor="platform">Platform</Label>
        <select
          id="platform"
          value={formData.platform}
          onChange={(e) =>
            setFormData({ ...formData, platform: e.target.value as OTAPlatform })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="airbnb_ical">Airbnb (iCal)</option>
          <option value="vrbo_ical">VRBO (iCal)</option>
          <option value="booking_api">Booking.com (API) - Coming Soon</option>
        </select>
      </div>

      {/* Import URL */}
      <div>
        <Label htmlFor="import_url">Import URL (iCal Feed)</Label>
        <Input
          id="import_url"
          type="url"
          value={formData.import_url}
          onChange={(e) =>
            setFormData({ ...formData, import_url: e.target.value })
          }
          placeholder="https://www.airbnb.com/calendar/ical/..."
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Copy the iCal export URL from your Airbnb listing settings
        </p>
      </div>

      {/* Sync Frequency */}
      <div>
        <Label htmlFor="sync_frequency">Sync Frequency</Label>
        <select
          id="sync_frequency"
          value={formData.sync_frequency_minutes}
          onChange={(e) =>
            setFormData({
              ...formData,
              sync_frequency_minutes: parseInt(e.target.value),
            })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="30">Every 30 minutes</option>
          <option value="60">Every 1 hour</option>
          <option value="120">Every 2 hours</option>
          <option value="240">Every 4 hours</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Connection'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
