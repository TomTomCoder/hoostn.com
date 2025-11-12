'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface BookingSummaryProps {
  lot: {
    id: string;
    title: string;
    primary_image_path: string | null;
  };
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  priceBreakdown: {
    nights: number;
    nightlyRate: number;
    accommodationTotal: number;
    cleaningFee: number;
    touristTax: number;
    total: number;
  };
}

export function BookingSummary({
  lot,
  checkIn,
  checkOut,
  guests,
  priceBreakdown,
}: BookingSummaryProps) {
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Card className="shadow-lg sticky top-8">
      <CardContent className="p-6">
        {/* Lot Info */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
          {lot.primary_image_path && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={`/api/images/${lot.primary_image_path}`}
                alt={lot.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-anthracite text-lg truncate">
              {lot.title}
            </h3>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <div className="text-sm text-gray-600 mb-1">Check-in</div>
            <div className="font-medium text-gray-anthracite">{formatDate(checkIn)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Check-out</div>
            <div className="font-medium text-gray-anthracite">{formatDate(checkOut)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Guests</div>
            <div className="font-medium text-gray-anthracite">
              {guests} guest{guests !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 mb-6">
          <h4 className="font-bold text-gray-anthracite mb-4">Price Details</h4>

          <div className="flex justify-between text-gray-600">
            <span>
              {formatCurrency(priceBreakdown.nightlyRate)} × {priceBreakdown.nights} night
              {priceBreakdown.nights !== 1 ? 's' : ''}
            </span>
            <span className="font-medium">
              {formatCurrency(priceBreakdown.accommodationTotal)}
            </span>
          </div>

          {priceBreakdown.cleaningFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Cleaning fee</span>
              <span className="font-medium">
                {formatCurrency(priceBreakdown.cleaningFee)}
              </span>
            </div>
          )}

          {priceBreakdown.touristTax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tourist tax</span>
              <span className="font-medium">
                {formatCurrency(priceBreakdown.touristTax)}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-anthracite">Total</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(priceBreakdown.total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
