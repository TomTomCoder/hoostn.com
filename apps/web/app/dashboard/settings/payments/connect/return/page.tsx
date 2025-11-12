/**
 * Stripe Connect Return Page
 * Landing page after Stripe Connect onboarding completes
 */

import { redirect } from 'next/navigation';
import { getConnectedAccountStatusAction } from '@/lib/actions/stripe-connect';

export default async function StripeConnectReturnPage() {
  // Sync account status
  const statusResult = await getConnectedAccountStatusAction();

  if (statusResult.success && statusResult.data.connected) {
    // Redirect to settings page with success message
    redirect('/dashboard/settings/payments?connected=true');
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 text-blue-600 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Stripe Connect Setup Complete!</h1>
        <p className="text-gray-600 mb-6">
          Your Stripe account has been successfully connected. You can now start accepting
          payments from guests.
        </p>
        <a
          href="/dashboard/settings/payments"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Payment Settings
        </a>
      </div>
    </div>
  );
}
