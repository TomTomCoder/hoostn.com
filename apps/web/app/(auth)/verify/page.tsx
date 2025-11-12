'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 2 seconds
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center py-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-anthracite mb-3">
            Email verified!
          </h1>
          <p className="text-gray-600 mb-6">
            Your account has been successfully verified.
          </p>

          {/* Redirecting Message */}
          <div className="inline-flex items-center justify-center space-x-2 text-primary">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="font-medium">
              Redirecting to dashboard{countdown > 0 ? ` in ${countdown}s` : ''}...
            </span>
          </div>
        </div>
      </div>

      {/* Manual link just in case */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Not redirected?{' '}
          <a
            href="/dashboard"
            className="text-primary hover:text-primary-dark transition-colors font-medium"
          >
            Click here
          </a>
        </p>
      </div>
    </div>
  );
}
