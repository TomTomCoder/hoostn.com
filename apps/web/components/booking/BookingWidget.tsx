'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, AlertCircle, Loader2 } from 'lucide-react';
import { checkAvailability, calculatePrice } from '@/lib/actions/availability';
import type { PriceBreakdown, AvailabilityCheck } from '@/types/booking';

interface BookingWidgetProps {
  lotId: string;
  basePrice: number | null;
  cleaningFee: number;
  maxGuests: number;
}

export function BookingWidget({
  lotId,
  basePrice,
  cleaningFee,
  maxGuests,
}: BookingWidgetProps) {
  const router = useRouter();

  // Form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  // Loading and error states
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // Auto-calculate when dates/guests change
  useEffect(() => {
    if (checkIn && checkOut && guests) {
      handleCalculate();
    } else {
      setPriceBreakdown(null);
      setAvailability(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, guests]);

  const handleCalculate = async () => {
    setError(null);
    setIsCheckingAvailability(true);
    setIsCalculatingPrice(true);

    try {
      // Check availability
      const availabilityResult = await checkAvailability(lotId, checkIn, checkOut);
      if (!availabilityResult.success) {
        setError(availabilityResult.error);
        setAvailability(null);
        setPriceBreakdown(null);
        return;
      }

      setAvailability(availabilityResult.data);

      // If not available, don't calculate price
      if (!availabilityResult.data.available) {
        setPriceBreakdown(null);
        return;
      }

      // Calculate price
      const priceResult = await calculatePrice(lotId, checkIn, checkOut, guests);
      if (!priceResult.success) {
        setError(priceResult.error);
        setPriceBreakdown(null);
        return;
      }

      setPriceBreakdown(priceResult.data);
    } catch (err) {
      console.error('Error calculating booking:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCheckingAvailability(false);
      setIsCalculatingPrice(false);
    }
  };

  const handleReserve = () => {
    if (!availability?.available || !priceBreakdown) {
      return;
    }

    // Navigate to booking page with query params
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
    });

    router.push(`/lots/${lotId}/book?${params.toString()}`);
  };

  const canReserve =
    checkIn &&
    checkOut &&
    guests &&
    availability?.available &&
    priceBreakdown &&
    !isCheckingAvailability &&
    !isCalculatingPrice;

  return (
    <div className="border border-gray-200 rounded-xl p-6 shadow-lg sticky top-24 bg-white">
      {/* Price Header */}
      <div className="mb-6">
        {basePrice !== null ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">${basePrice}</span>
            <span className="text-gray-600">/ night</span>
          </div>
        ) : (
          <div className="text-gray-600">Contact for pricing</div>
        )}
      </div>

      {/* Date Inputs */}
      <div className="space-y-4 mb-4">
        {/* Check-in Date */}
        <div>
          <label
            htmlFor="check-in"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Check-in
          </label>
          <div className="relative">
            <input
              type="date"
              id="check-in"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Check-out Date */}
        <div>
          <label
            htmlFor="check-out"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Check-out
          </label>
          <div className="relative">
            <input
              type="date"
              id="check-out"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Guests Selector */}
        <div>
          <label
            htmlFor="guests"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Guests
          </label>
          <div className="relative">
            <select
              id="guests"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
            <Users className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Availability Warning */}
      {availability && !availability.available && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            {availability.reason || 'Not available for selected dates'}
          </p>
        </div>
      )}

      {/* Price Breakdown */}
      {priceBreakdown && availability?.available && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              ${priceBreakdown.nightlyRate} × {priceBreakdown.nights}{' '}
              {priceBreakdown.nights === 1 ? 'night' : 'nights'}
            </span>
            <span className="text-gray-900">
              ${priceBreakdown.accommodationTotal.toFixed(2)}
            </span>
          </div>

          {priceBreakdown.cleaningFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cleaning fee</span>
              <span className="text-gray-900">
                ${priceBreakdown.cleaningFee.toFixed(2)}
              </span>
            </div>
          )}

          {priceBreakdown.touristTax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tourist tax</span>
              <span className="text-gray-900">
                ${priceBreakdown.touristTax.toFixed(2)}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${priceBreakdown.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isCheckingAvailability || isCalculatingPrice) && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking availability...</span>
        </div>
      )}

      {/* Reserve Button */}
      <button
        onClick={handleReserve}
        disabled={!canReserve}
        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {canReserve ? 'Reserve' : 'Select dates to book'}
      </button>

      {/* Info Text */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        You won't be charged yet
      </p>

      {/* Minimum Stay Info */}
      {availability?.minNights && availability.minNights > 1 && (
        <div className="mt-4 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            Minimum stay: {availability.minNights} nights
          </p>
        </div>
      )}
    </div>
  );
}
