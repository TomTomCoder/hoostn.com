'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithMagicLink } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';

type FormState = 'initial' | 'loading' | 'success' | 'error';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('initial');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage('Email is required');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      const formData = new FormData(e.currentTarget);
      const result = await signInWithMagicLink(formData);

      if ('success' in result && result.success) {
        setState('success');
      } else if ('error' in result) {
        setState('error');
        setErrorMessage(result.error);
      }
    } catch (error) {
      setState('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-anthracite mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Sign in to your Hoostn account
          </p>
        </div>

        {/* Success State */}
        {state === 'success' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-anthracite mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 mb-1">
              We sent a magic link to
            </p>
            <p className="text-primary font-medium mb-6">
              {email}
            </p>
            <p className="text-sm text-gray-500">
              Click the link in the email to sign in to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {state === 'error' && errorMessage && (
              <div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-error mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-error font-medium">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-anthracite mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === 'loading'}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Email address"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={state === 'loading'}
                className="w-full"
              >
                {state === 'loading' ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Sending magic link...
                  </span>
                ) : (
                  'Send magic link'
                )}
              </Button>
            </form>

            {/* Sign up link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Additional help */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Trouble signing in?{' '}
          <a
            href="mailto:support@hoostn.com"
            className="text-primary hover:text-primary-dark transition-colors"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
