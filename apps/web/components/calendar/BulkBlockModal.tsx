/**
 * BulkBlockModal Component
 * Modal for bulk blocking dates across multiple lots
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PropertyWithLots, BulkBlockInput } from '@/types/calendar';
import { bulkBlockDates } from '@/lib/actions/calendar';

interface BulkBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyWithLots[];
  onSuccess: () => void;
}

export function BulkBlockModal({
  isOpen,
  onClose,
  properties,
  onSuccess,
}: BulkBlockModalProps) {
  const [step, setStep] = useState(1);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLotToggle = (lotId: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    const input: BulkBlockInput = {
      lotIds: selectedLotIds,
      startDate,
      endDate,
      reason,
      ruleType: 'blocked',
    };

    const result = await bulkBlockDates(input);

    if (result.success) {
      onSuccess();
      handleClose();
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedLotIds([]);
    setStartDate('');
    setEndDate('');
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bulk Block Dates</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Select Lots */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Step 1: Select Lots</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {properties.map((property) => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="font-medium text-gray-800 mb-2">{property.name}</div>
                    <div className="space-y-1 ml-4">
                      {property.lots.map((lot) => (
                        <label
                          key={lot.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLotIds.includes(lot.id)}
                            onChange={() => handleLotToggle(lot.id)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{lot.title}</span>
                        </label>
                      ))}
                      {property.lots.length === 0 && (
                        <p className="text-sm text-gray-500 p-2">No lots available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {selectedLotIds.length} lot(s) selected
              </p>
            </div>
          )}

          {/* Step 2: Select Date Range */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Step 2: Select Date Range</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configure Block */}
          {step === 3 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Step 3: Configure Block</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason for Blocking</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Maintenance, Owner use, Renovation"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>
                      <strong>Lots:</strong> {selectedLotIds.length} selected
                    </li>
                    <li>
                      <strong>Date Range:</strong> {startDate} to {endDate}
                    </li>
                    <li>
                      <strong>Reason:</strong> {reason || 'None provided'}
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Step {step} of 3
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && selectedLotIds.length === 0) ||
                  (step === 2 && (!startDate || !endDate))
                }
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? 'Blocking...' : 'Block Dates'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
