'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';

interface SeasonalPricing {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  min_nights: number;
}

interface PricingConfigurationProps {
  basePrice?: number | null;
  cleaningFee: number;
  touristTax: number;
  seasonalPricing: SeasonalPricing[];
  onBasePriceChange: (value: number | null) => void;
  onCleaningFeeChange: (value: number) => void;
  onTouristTaxChange: (value: number) => void;
  onSeasonalPricingChange: (value: SeasonalPricing[]) => void;
  errors?: {
    base_price?: { message?: string };
    cleaning_fee?: { message?: string };
    tourist_tax?: { message?: string };
  };
  className?: string;
}

export function PricingConfiguration({
  basePrice,
  cleaningFee,
  touristTax,
  seasonalPricing,
  onBasePriceChange,
  onCleaningFeeChange,
  onTouristTaxChange,
  onSeasonalPricingChange,
  errors,
  className,
}: PricingConfigurationProps) {
  const [showSeasonalForm, setShowSeasonalForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [seasonalForm, setSeasonalForm] = useState<SeasonalPricing>({
    name: '',
    start_date: '',
    end_date: '',
    price_per_night: 0,
    min_nights: 1,
  });

  // Add or update seasonal pricing
  const handleSaveSeasonalPricing = () => {
    if (editingIndex !== null) {
      // Update existing
      const updated = [...seasonalPricing];
      updated[editingIndex] = seasonalForm;
      onSeasonalPricingChange(updated);
    } else {
      // Add new
      onSeasonalPricingChange([...seasonalPricing, seasonalForm]);
    }
    // Reset form
    setSeasonalForm({
      name: '',
      start_date: '',
      end_date: '',
      price_per_night: 0,
      min_nights: 1,
    });
    setShowSeasonalForm(false);
    setEditingIndex(null);
  };

  // Edit seasonal pricing
  const handleEditSeasonalPricing = (index: number) => {
    setSeasonalForm(seasonalPricing[index]);
    setEditingIndex(index);
    setShowSeasonalForm(true);
  };

  // Delete seasonal pricing
  const handleDeleteSeasonalPricing = (index: number) => {
    onSeasonalPricingChange(seasonalPricing.filter((_, i) => i !== index));
  };

  // Cancel seasonal form
  const handleCancelSeasonalForm = () => {
    setSeasonalForm({
      name: '',
      start_date: '',
      end_date: '',
      price_per_night: 0,
      min_nights: 1,
    });
    setShowSeasonalForm(false);
    setEditingIndex(null);
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Base Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-anthracite">Base Pricing</h3>

        {/* Base Price */}
        <div>
          <label
            htmlFor="base_price"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Base Price per Night (€)
          </label>
          <input
            id="base_price"
            type="number"
            min="0"
            step="0.01"
            value={basePrice || ''}
            onChange={(e) =>
              onBasePriceChange(e.target.value ? parseFloat(e.target.value) : null)
            }
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors?.base_price
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            placeholder="e.g., 100.00"
          />
          {errors?.base_price && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.base_price.message}
            </p>
          )}
        </div>

        {/* Cleaning Fee */}
        <div>
          <label
            htmlFor="cleaning_fee"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Cleaning Fee (€)
          </label>
          <input
            id="cleaning_fee"
            type="number"
            min="0"
            step="0.01"
            value={cleaningFee}
            onChange={(e) => onCleaningFeeChange(parseFloat(e.target.value) || 0)}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors?.cleaning_fee
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            placeholder="e.g., 50.00"
          />
          {errors?.cleaning_fee && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.cleaning_fee.message}
            </p>
          )}
        </div>

        {/* Tourist Tax */}
        <div>
          <label
            htmlFor="tourist_tax"
            className="block text-sm font-medium text-gray-anthracite mb-2"
          >
            Tourist Tax per Night (€)
          </label>
          <input
            id="tourist_tax"
            type="number"
            min="0"
            step="0.01"
            value={touristTax}
            onChange={(e) => onTouristTaxChange(parseFloat(e.target.value) || 0)}
            className={clsx(
              'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
              errors?.tourist_tax
                ? 'border-error focus:ring-error'
                : 'border-gray-300'
            )}
            placeholder="e.g., 2.50"
          />
          {errors?.tourist_tax && (
            <p className="mt-1 text-sm text-error" role="alert">
              {errors.tourist_tax.message}
            </p>
          )}
        </div>
      </div>

      {/* Seasonal Pricing */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-anthracite">
            Seasonal Pricing <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </h3>
          {!showSeasonalForm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSeasonalForm(true)}
            >
              + Add Season
            </Button>
          )}
        </div>

        {/* Seasonal Pricing List */}
        {seasonalPricing.length > 0 && (
          <div className="space-y-2">
            {seasonalPricing.map((season, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-anthracite">{season.name}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(season.start_date).toLocaleDateString()} -{' '}
                    {new Date(season.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    €{season.price_per_night}/night | Min {season.min_nights} nights
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditSeasonalPricing(index)}
                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSeasonalPricing(index)}
                    className="px-3 py-1 text-sm text-error hover:bg-error/10 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seasonal Pricing Form */}
        {showSeasonalForm && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
            <h4 className="font-medium text-gray-anthracite">
              {editingIndex !== null ? 'Edit Seasonal Pricing' : 'Add Seasonal Pricing'}
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-anthracite mb-2">
                Season Name
              </label>
              <input
                type="text"
                value={seasonalForm.name}
                onChange={(e) =>
                  setSeasonalForm({ ...seasonalForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Summer 2026, Christmas 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-anthracite mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={seasonalForm.start_date}
                  onChange={(e) =>
                    setSeasonalForm({ ...seasonalForm, start_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-anthracite mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={seasonalForm.end_date}
                  onChange={(e) =>
                    setSeasonalForm({ ...seasonalForm, end_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-anthracite mb-2">
                  Price per Night (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={seasonalForm.price_per_night}
                  onChange={(e) =>
                    setSeasonalForm({
                      ...seasonalForm,
                      price_per_night: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 150.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-anthracite mb-2">
                  Minimum Nights
                </label>
                <input
                  type="number"
                  min="1"
                  value={seasonalForm.min_nights}
                  onChange={(e) =>
                    setSeasonalForm({
                      ...seasonalForm,
                      min_nights: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveSeasonalPricing}
                disabled={
                  !seasonalForm.name ||
                  !seasonalForm.start_date ||
                  !seasonalForm.end_date ||
                  !seasonalForm.price_per_night
                }
              >
                {editingIndex !== null ? 'Update Season' : 'Add Season'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelSeasonalForm}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
