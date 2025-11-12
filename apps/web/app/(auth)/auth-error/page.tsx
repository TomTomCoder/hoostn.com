'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const message = searchParams.get('message');
    setErrorMessage(
      message || 'An error occurred during authentication. Please try again.'
    );
  }, [searchParams]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center py-6">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-anthracite mb-3">
            Authentication failed
          </h1>
          <p className="text-gray-600 mb-8">
            {errorMessage}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Try signing in again
              </Button>
            </Link>
            <Link href="/signup" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Create a new account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Support link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Need help?{' '}
          <a
            href="mailto:support@hoostn.com"
            className="text-primary hover:text-primary-dark transition-colors font-medium"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
