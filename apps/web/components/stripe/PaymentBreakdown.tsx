'use client';

/**
 * Payment Breakdown Component
 * Displays detailed price breakdown for a reservation
 */

import type { PaymentBreakdown } from '@/types/stripe';

interface PaymentBreakdownProps {
  breakdown: PaymentBreakdown;
  className?: string;
}

export function PaymentBreakdown({ breakdown, className }: PaymentBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: breakdown.currency,
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className || ''}`}>
      <h3 className="text-lg font-semibold mb-4">Payment Breakdown</h3>

      <div className="space-y-3">
        {/* Accommodation */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Accommodation</span>
          <span className="font-medium">{formatCurrency(breakdown.accommodationTotal)}</span>
        </div>

        {/* Cleaning Fee */}
        {breakdown.cleaningFee > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Cleaning Fee</span>
            <span className="font-medium">{formatCurrency(breakdown.cleaningFee)}</span>
          </div>
        )}

        {/* Tourist Tax */}
        {breakdown.touristTax > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tourist Tax</span>
            <span className="font-medium">{formatCurrency(breakdown.touristTax)}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(breakdown.subtotal)}</span>
        </div>

        {/* Platform Fee (shown separately for transparency) */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Platform Fee (deducted from host payout)
          </span>
          <span className="text-gray-500">{formatCurrency(breakdown.platformFee)}</span>
        </div>

        {/* Security Deposit */}
        {breakdown.securityDeposit > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Security Deposit (held)</span>
            <span className="text-gray-500">{formatCurrency(breakdown.securityDeposit)}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-lg font-semibold">Guest Total</span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(breakdown.total)}
          </span>
        </div>

        {/* Host Payout */}
        <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Host Payout</span>
          <span className="text-sm font-semibold text-green-600">
            {formatCurrency(breakdown.hostPayout)}
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          The platform fee is automatically deducted from the host payout. Guests pay
          the subtotal amount shown above.
        </p>
      </div>
    </div>
  );
}
