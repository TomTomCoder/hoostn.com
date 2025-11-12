'use client';

/**
 * Stripe Connect Onboarding Button
 * Button to initiate Stripe Connect onboarding flow
 */

import { useState } from 'react';
import { initializeStripeConnect } from '@/lib/actions/stripe-connect';

interface ConnectOnboardingButtonProps {
  className?: string;
}

export function ConnectOnboardingButton({ className }: ConnectOnboardingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await initializeStripeConnect();

      if (!result.success) {
        setError(result.error || 'Failed to initialize Stripe Connect');
        setLoading(false);
        return;
      }

      // Redirect to Stripe onboarding
      window.location.href = result.data.onboardingUrl;
    } catch (err) {
      console.error('Error initializing Stripe Connect:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className || ''}`}
      >
        {loading ? 'Initializing...' : 'Connect with Stripe'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
