/**
 * Stripe Connect Refresh Page
 * Landing page when user needs to complete onboarding again
 */

import { ConnectOnboardingButton } from '@/components/stripe/ConnectOnboardingButton';

export default function StripeConnectRefreshPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg border p-8">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-yellow-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-center mb-2">
            Complete Your Stripe Setup
          </h1>
          <p className="text-gray-600 text-center">
            It looks like your Stripe Connect onboarding is incomplete. Please continue the
            setup process to start accepting payments.
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-900 mb-2">What you need:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            <li>Business information and tax ID</li>
            <li>Bank account details for payouts</li>
            <li>Identity verification documents</li>
            <li>Business ownership information</li>
          </ul>
        </div>

        <div className="text-center">
          <ConnectOnboardingButton />
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard/settings/payments"
            className="text-sm text-gray-600 hover:underline"
          >
            Return to Payment Settings
          </a>
        </div>
      </div>
    </div>
  );
}
