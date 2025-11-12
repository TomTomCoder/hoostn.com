'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';

export interface AvailabilityRule {
  id?: string;
  start_date: string;
  end_date: string;
  rule_type: 'blocked' | 'price_override' | 'min_stay';
  price_per_night?: number | null;
  min_nights?: number | null;
  reason?: string | null;
}

interface DateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: AvailabilityRule) => void;
  initialData?: AvailabilityRule;
  selectedDate?: Date;
}

export function DateBlockModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  selectedDate,
}: DateBlockModalProps) {
  const [formData, setFormData] = useState<AvailabilityRule>({
    start_date: '',
    end_date: '',
    rule_type: 'blocked',
    price_per_night: null,
    min_nights: null,
    reason: '',
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        setFormData({
          start_date: dateStr,
          end_date: dateStr,
          rule_type: 'blocked',
          price_per_night: null,
          min_nights: null,
          reason: '',
        });
      }
    }
  }, [isOpen, initialData, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      start_date: '',
      end_date: '',
      rule_type: 'blocked',
      price_per_night: null,
      min_nights: null,
      reason: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-xl font-semibold text-gray-anthracite mb-4">
          {initialData ? 'Edit Availability Rule' : 'Block Dates'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-gray-anthracite mb-2"
              >
                Start Date <span className="text-error">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-gray-anthracite mb-2"
              >
                End Date <span className="text-error">*</span>
              </label>
              <input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                required
                min={formData.start_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Rule Type */}
          <div>
            <label
              htmlFor="rule_type"
              className="block text-sm font-medium text-gray-anthracite mb-2"
            >
              Rule Type <span className="text-error">*</span>
            </label>
            <select
              id="rule_type"
              value={formData.rule_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rule_type: e.target.value as AvailabilityRule['rule_type'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="blocked">Blocked (Not Available)</option>
              <option value="price_override">Price Override</option>
              <option value="min_stay">Minimum Stay</option>
            </select>
          </div>

          {/* Price Override Field */}
          {formData.rule_type === 'price_override' && (
            <div>
              <label
                htmlFor="price_per_night"
                className="block text-sm font-medium text-gray-anthracite mb-2"
              >
                Price per Night (€) <span className="text-error">*</span>
              </label>
              <input
                id="price_per_night"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_per_night || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_per_night: parseFloat(e.target.value) || null,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 150.00"
              />
            </div>
          )}

          {/* Minimum Nights Field */}
          {formData.rule_type === 'min_stay' && (
            <div>
              <label
                htmlFor="min_nights"
                className="block text-sm font-medium text-gray-anthracite mb-2"
              >
                Minimum Nights <span className="text-error">*</span>
              </label>
              <input
                id="min_nights"
                type="number"
                min="1"
                value={formData.min_nights || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_nights: parseInt(e.target.value) || null,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 3"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-anthracite mb-2"
            >
              Reason (Optional)
            </label>
            <textarea
              id="reason"
              value={formData.reason || ''}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
              placeholder="e.g., Maintenance, Personal use, Holiday season"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
            >
              {initialData ? 'Update Rule' : 'Block Dates'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
