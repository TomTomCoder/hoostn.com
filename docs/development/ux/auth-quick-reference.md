# Authentication Quick Reference

## Magic Link Implementation

```typescript
// API Route: /api/auth/magic-link
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';

const redis = Redis.fromEnv();
const resend = new Resend(process.env.RESEND_API_KEY);

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
});

export async function POST(req: Request) {
  const { email } = await req.json();
  
  // Rate limit by email
  const { success } = await ratelimit.limit(email);
  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Generate token
  const token = crypto.randomUUID();
  await redis.set(`magic:${token}`, email, { ex: 900 }); // 15 min
  
  // Send email
  await resend.emails.send({
    from: 'Hoostn <auth@hoostn.com>',
    to: email,
    subject: 'Sign in to Hoostn',
    html: `
      <h2>Welcome back!</h2>
      <p>Click the link below to sign in:</p>
      <a href="${process.env.NEXTAUTH_URL}/auth/verify?token=${token}">
        Sign in to Hoostn
      </a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
  
  return Response.json({ success: true });
}
```

## Form Component Template

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateEmail } from '@/lib/validations/auth';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (sent) {
    return (
      <div className="text-center">
        <h3>Check your email</h3>
        <p>We sent a sign-in link to {email}</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        placeholder="you@example.com"
        required
      />
      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className="w-full"
      >
        Send Magic Link
      </Button>
    </form>
  );
}
```

## Hoostn Color Classes

```typescript
// Primary actions
className="bg-primary hover:bg-primary-dark text-white"

// Success states
className="bg-accent hover:bg-accent-dark text-white"

// Errors
className="text-error"

// Text
className="text-gray-anthracite"

// Backgrounds
className="bg-gray-light"

// Focus rings
className="focus:ring-2 focus:ring-accent focus:ring-offset-2"
```

## Accessibility Checklist

- [ ] All inputs have labels
- [ ] Error messages use role="alert"
- [ ] Focus indicators visible (3px accent color)
- [ ] Keyboard navigation works
- [ ] Touch targets ≥44px
- [ ] Contrast ratio ≥4.5:1

## Security Checklist

- [ ] CSRF tokens on forms
- [ ] Rate limiting implemented
- [ ] HttpOnly, Secure cookies
- [ ] SameSite=Lax cookie attribute
- [ ] Input validation (client + server)
- [ ] Brute force protection

## Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, sans-serif; }
    .button {
      background: #00C48C;
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <h2>Welcome back to Hoostn! 👋</h2>
  <p>Click the button below to sign in:</p>
  <a href="{{link}}" class="button">Sign in to Hoostn</a>
  <p>This link expires in 15 minutes.</p>
  <p>If you didn't request this, you can safely ignore this email.</p>
</body>
</html>
```

## Common Patterns

### Loading State
```typescript
<Button loading={isLoading}>
  {isLoading ? 'Sending...' : 'Send Magic Link'}
</Button>
```

### Error Display
```typescript
{error && (
  <p className="text-sm text-error flex items-center gap-1">
    <AlertCircle className="h-4 w-4" />
    {error}
  </p>
)}
```

### Success State
```typescript
<div className="bg-accent/10 text-accent p-4 rounded-lg">
  <CheckCircle className="inline mr-2" />
  Email sent successfully!
</div>
```
