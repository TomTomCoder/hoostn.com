# Authentication Code Examples

Complete, production-ready code examples for Hoostn authentication.

## Table of Contents
1. [Complete Sign-In Form](#complete-sign-in-form)
2. [Enhanced Input Component](#enhanced-input-component)
3. [Magic Link API Route](#magic-link-api-route)
4. [Email Templates](#email-templates)
5. [Rate Limiting Utility](#rate-limiting-utility)
6. [Form Validation Hooks](#form-validation-hooks)
7. [Social Login Buttons](#social-login-buttons)

---

## Complete Sign-In Form

```typescript
// components/auth/SignInForm.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { validateEmail } from '@/lib/validations/auth';

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo = '/dashboard' }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const finalRedirect = searchParams.get('redirect') || redirectTo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: finalRedirect,
      });

      if (result?.error) {
        setError('Failed to send magic link. Please try again.');
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setEmail('');
  };

  if (emailSent) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-anthracite">
              Check your email
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We sent a magic link to
            </p>
            <p className="mt-1 text-base font-medium text-gray-anthracite">
              {email}
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Click the link in the email to sign in. The link expires in 15 minutes.
            </p>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
            >
              Try a different email
            </Button>
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            label="Email address"
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            placeholder="you@example.com"
            hint="We'll send you a magic link to sign in"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          Send Magic Link
        </Button>
      </form>

      <Divider text="or" className="my-6" />

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/login/password')}
        >
          Sign in with password instead
        </Button>
      </div>
    </Card>
  );
}
```

---

## Enhanced Input Component

```typescript
// components/ui/input.tsx
import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      success,
      leftIcon,
      rightIcon,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const hasError = !!error;
    const showSuccess = success && !hasError;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-anthracite"
          >
            {label}
            {required && (
              <span className="text-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            className={clsx(
              'block w-full rounded-lg border px-4 py-3',
              'text-gray-anthracite placeholder:text-gray-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              {
                'border-gray-300 focus:border-accent focus:ring-accent':
                  !hasError && !showSuccess,
                'border-error focus:border-error focus:ring-error': hasError,
                'border-accent focus:border-accent focus:ring-accent':
                  showSuccess,
                'pl-10': leftIcon,
                'pr-10': rightIcon || hasError || showSuccess,
              },
              'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${inputId}-error`
                : hint
                ? `${inputId}-hint`
                : undefined
            }
            {...props}
          />

          {(rightIcon || hasError || showSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="h-5 w-5 text-error" />
              ) : showSuccess ? (
                <CheckCircle className="h-5 w-5 text-accent" />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {hint && !hasError && (
          <p
            id={`${inputId}-hint`}
            className="text-sm text-gray-600"
          >
            {hint}
          </p>
        )}

        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-sm text-error flex items-start gap-1"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

## Magic Link API Route

```typescript
// app/api/auth/magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { MagicLinkEmail } from '@/emails/MagicLinkEmail';

const redis = Redis.fromEnv();
const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting: 3 requests per 10 minutes per email
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  analytics: true,
  prefix: 'ratelimit:magic-link',
});

export async function POST(req: NextRequest) {
  try {
    const { email, redirect } = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting by email
    const { success, limit, remaining, reset } = await ratelimit.limit(
      normalizedEmail
    );

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Please wait ${Math.ceil(retryAfter / 60)} minutes before requesting another link.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store token in Redis
    await redis.set(
      `magic:${token}`,
      {
        email: normalizedEmail,
        redirect: redirect || '/dashboard',
        createdAt: Date.now(),
      },
      {
        ex: 900, // 15 minutes expiration
      }
    );

    // Generate magic link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/auth/verify?token=${token}`;

    // Send email
    const { data, error: emailError } = await resend.emails.send({
      from: 'Hoostn <auth@hoostn.com>',
      to: normalizedEmail,
      subject: 'Sign in to Hoostn',
      react: MagicLinkEmail({
        magicLink,
        email: normalizedEmail,
        expiresInMinutes: 15,
      }),
    });

    if (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Email Templates

```typescript
// emails/MagicLinkEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MagicLinkEmailProps {
  magicLink: string;
  email: string;
  expiresInMinutes: number;
}

export const MagicLinkEmail = ({
  magicLink,
  email,
  expiresInMinutes = 15,
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Sign in to your Hoostn account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src="https://hoostn.com/logo.png"
              width="120"
              height="40"
              alt="Hoostn"
              style={logo}
            />
          </Section>

          <Heading style={h1}>Welcome back! 👋</Heading>

          <Text style={text}>
            Click the button below to sign in to your Hoostn account:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={magicLink}>
              Sign in to Hoostn
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>

          <Text style={code}>{magicLink}</Text>

          <Text style={textSmall}>
            This link will expire in {expiresInMinutes} minutes and can only be
            used once.
          </Text>

          <Text style={textSmall}>
            If you didn't request this email, you can safely ignore it.
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              Hoostn - Your smart way to manage vacation rentals
            </Text>
            <Link href="https://hoostn.com" style={footerLink}>
              hoostn.com
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#F5F6F8',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '16px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const textSmall = {
  color: '#6B7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#00C48C',
  borderRadius: '16px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const code = {
  backgroundColor: '#F5F6F8',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  color: '#1F3A8A',
  fontSize: '14px',
  padding: '12px',
  wordBreak: 'break-all' as const,
};

const footer = {
  borderTop: '1px solid #E5E7EB',
  marginTop: '32px',
  paddingTop: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6B7280',
  fontSize: '14px',
  margin: '0 0 8px',
};

const footerLink = {
  color: '#1F3A8A',
  fontSize: '14px',
  textDecoration: 'underline',
};
```

---

## Rate Limiting Utility

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Create different rate limiters for different use cases
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

export const emailRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  analytics: true,
  prefix: 'ratelimit:email',
});

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// Helper function to check rate limit
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return {
      allowed: false,
      retryAfter,
      error: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
    };
  }

  return {
    allowed: true,
    remaining,
    limit,
    reset,
  };
}

// Middleware to add rate limit headers
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  reset: number
) {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
  return response;
}
```

---

## Form Validation Hooks

```typescript
// lib/hooks/useFormValidation.ts
import { useState, useCallback, ChangeEvent } from 'react';

type ValidationRule<T> = (value: T) => string | null;

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: any): string | null => {
      const validator = validationRules[name];
      if (!validator) return null;
      return validator(value);
    },
    [validationRules]
  );

  const handleChange = useCallback(
    (name: keyof T) => (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value = e.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));

      // Real-time validation if field was touched and has error
      if (touched[name] && errors[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error || undefined,
        }));
      }
    },
    [errors, touched, validateField]
  );

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name, values[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: error || undefined,
      }));
    },
    [validateField, values]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    (Object.keys(values) as Array<keyof T>).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      (Object.keys(values) as Array<keyof T>).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    // Focus first error field
    if (!isValid) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
    }

    return isValid;
  }, [values, validateField]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) =>
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll()) {
          return;
        }

        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      },
    [validateAll, values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateAll,
    reset,
    setFieldValue,
    setFieldError,
  };
}

// Example usage:
/*
const MyForm = () => {
  const form = useFormValidation(
    { email: '', password: '' },
    {
      email: validateEmail,
      password: validatePassword,
    }
  );

  return (
    <form onSubmit={form.handleSubmit(async (values) => {
      await signIn(values);
    })}>
      <Input
        value={form.values.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        error={form.touched.email ? form.errors.email : undefined}
      />
      <Button type="submit" loading={form.isSubmitting}>
        Submit
      </Button>
    </form>
  );
};
*/
```

---

## Social Login Buttons

```typescript
// components/auth/SocialLoginButtons.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface SocialLoginButtonsProps {
  redirectTo?: string;
}

export function SocialLoginButtons({
  redirectTo = '/dashboard',
}: SocialLoginButtonsProps) {
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const finalRedirect = searchParams.get('redirect') || redirectTo;

  const handleSocialLogin = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, {
        callbackUrl: finalRedirect,
      });
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-3"
        onClick={() => handleSocialLogin('google')}
        loading={loadingProvider === 'google'}
        disabled={!!loadingProvider}
      >
        <GoogleIcon className="h-5 w-5" />
        <span className="flex-1 text-left">Continue with Google</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start gap-3"
        onClick={() => handleSocialLogin('microsoft')}
        loading={loadingProvider === 'microsoft'}
        disabled={!!loadingProvider}
      >
        <MicrosoftIcon className="h-5 w-5" />
        <span className="flex-1 text-left">Continue with Microsoft</span>
      </Button>
    </div>
  );
}

// Icon components (using SVGs)
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M13 1h10v10H13z" />
    <path fill="#7FBA00" d="M1 13h10v10H1z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);
```

---

## Complete Page Example

```typescript
// app/(auth)/login/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';
import { Logo } from '@/components/ui/logo';

export const metadata: Metadata = {
  title: 'Sign In - Hoostn',
  description: 'Sign in to your Hoostn account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-light px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="mx-auto h-12 w-auto" />
          <h1 className="mt-6 text-3xl font-bold text-gray-anthracite">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your vacation rentals
          </p>
        </div>

        {/* Form */}
        <SignInForm />

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            New to Hoostn?{' '}
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Create an account
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Environment Variables

```env
# .env.local

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hoostn

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxxxxxxxxxx

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "next-auth": "^4.24.0",
    "@auth/prisma-adapter": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@upstash/redis": "^1.25.0",
    "@upstash/ratelimit": "^1.0.0",
    "resend": "^2.0.0",
    "@react-email/components": "^0.0.11",
    "lucide-react": "^0.292.0",
    "clsx": "^2.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

These examples are production-ready and follow all the best practices outlined in the main authentication guide. Copy and adapt them to your specific needs!
