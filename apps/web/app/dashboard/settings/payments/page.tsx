/**
 * Payments Settings Page
 * Configure Stripe Connect and payment settings
 */

import { ConnectOnboardingButton } from '@/components/stripe/ConnectOnboardingButton';
import { ConnectStatus } from '@/components/stripe/ConnectStatus';
import { getConnectedAccountStatusAction } from '@/lib/actions/stripe-connect';

export default async function PaymentsSettingsPage() {
  // Fetch initial status server-side
  const statusResult = await getConnectedAccountStatusAction();
  const isConnected = statusResult.success && statusResult.data.connected;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
        <p className="text-gray-600">
          Manage your Stripe Connect integration and payment settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Stripe Connect Section */}
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Stripe Connect</h2>
            <p className="text-gray-600">
              Connect your Stripe account to accept payments from guests. The platform will
              automatically deduct a 5% commission from each booking.
            </p>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  Getting Started with Stripe Connect
                </h3>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>Click the button below to connect your Stripe account</li>
                  <li>Complete the onboarding process with Stripe</li>
                  <li>Once approved, you can start accepting payments</li>
                  <li>Payouts are sent automatically to your bank account</li>
                </ul>
              </div>

              <ConnectOnboardingButton />
            </div>
          ) : (
            <ConnectStatus />
          )}
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Platform Commission</h3>
              <p className="text-gray-600 text-sm mb-2">
                A 5% commission is automatically deducted from each booking payment. This
                fee covers platform maintenance, payment processing, and support.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">5%</span>
                <span className="text-gray-500">of booking total</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Payment Modes</h3>
              <p className="text-gray-600 text-sm mb-3">
                You can choose between two payment capture modes for each booking:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Full Payment (Immediate)</p>
                    <p className="text-xs text-gray-600">
                      Payment is captured immediately when guest books
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Hold (72 Hours)</p>
                    <p className="text-xs text-gray-600">
                      Payment is authorized but held for 72 hours before automatic capture
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Supported Payment Methods</h3>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">Credit Cards</span>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">Debit Cards</span>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                  SEPA Direct Debit
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">Apple Pay</span>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">Google Pay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Payout Schedule</h2>
          <p className="text-gray-600 text-sm mb-4">
            Stripe automatically handles payouts to your bank account after the platform
            commission is deducted.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Default Schedule</span>
              <span className="font-medium">Daily</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Currency</span>
              <span className="font-medium">EUR</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Processing Time</span>
              <span className="font-medium">2-3 business days</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
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
              <div>
                <p className="font-medium text-sm">PCI DSS Compliant</p>
                <p className="text-xs text-gray-600">
                  All payment data is handled securely by Stripe
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
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
              <div>
                <p className="font-medium text-sm">Fraud Protection</p>
                <p className="text-xs text-gray-600">
                  Stripe Radar automatically screens for fraudulent transactions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
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
              <div>
                <p className="font-medium text-sm">Secure Transfers</p>
                <p className="text-xs text-gray-600">
                  Bank transfers are encrypted and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
