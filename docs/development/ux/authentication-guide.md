# Authentication UX & Security Guide - Hoostn.com

**Version:** 1.0  
**Last Updated:** November 2025  
**Author:** Development Team

---

## Table of Contents

1. [Authentication Flow UX](#1-authentication-flow-ux)
2. [Form Design Best Practices](#2-form-design-best-practices)
3. [Security Best Practices](#3-security-best-practices)
4. [Modern Authentication Patterns](#4-modern-authentication-patterns)
5. [Tailwind UI Implementation](#5-tailwind-ui-implementation)
6. [Component Architecture](#6-component-architecture)
7. [Accessibility Checklist](#7-accessibility-checklist)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Authentication Flow UX

### 1.1 Magic Link vs Password-Based Auth

#### Recommendation: **Magic Link Primary, Password Optional**

**Why Magic Links for Hoostn:**
- ✅ Better security (no password reuse, no weak passwords)
- ✅ Reduced friction (no password recovery flows)
- ✅ Professional SaaS standard (Notion, Slack, Linear)
- ✅ Mobile-friendly (email apps are always accessible)
- ✅ Fits Hoostn's "simplify, not complicate" brand promise

**Implementation Strategy:**

```
┌─────────────────────────────────────────┐
│  Sign In Flow (Recommended)             │
├─────────────────────────────────────────┤
│                                         │
│  1. Enter email                         │
│  2. Click "Send Magic Link"             │
│  3. Check email                         │
│  4. Click link → Auto-login             │
│                                         │
│  Optional: "Use password instead" link  │
└─────────────────────────────────────────┘
```

**When to Offer Passwords:**
- B2B enterprise customers who require it
- Users who explicitly request it
- Admin accounts (for emergency access)

**Best Practice:**
```typescript
// Auth flow priority
1st choice: Magic Link (default, prominent)
2nd choice: Password (available but not emphasized)
3rd choice: OAuth (Google, Microsoft - future phase)
```

---

### 1.2 Sign Up Flow Best Practices

#### Recommended Flow: **Progressive Onboarding**

**Step 1: Minimal Sign Up (Email Only)**
```
┌──────────────────────────────────┐
│  Welcome to Hoostn              │
│                                  │
│  [Email input]                  │
│  [Send Magic Link button]       │
│                                  │
│  Already have account? Sign in  │
└──────────────────────────────────┘
```

**Step 2: Email Verification & Name Collection**
```
┌──────────────────────────────────┐
│  Complete Your Profile          │
│                                  │
│  [First Name]                   │
│  [Last Name]                    │
│  [Company (optional)]           │
│                                  │
│  [Continue to Dashboard]        │
└──────────────────────────────────┘
```

**Step 3: Role-Based Onboarding (Post-Auth)**
```
What describes you best?
○ Property Owner (1-5 properties)
○ Property Manager (6-20 properties)
○ Property Management Company (21+)
○ Vacation Rental Agency
```

**Key Principles:**
- Never ask for more than email initially
- Verify email before collecting additional info
- Progressive disclosure: collect data as needed
- Auto-save progress (no data loss)

---

### 1.3 Email Verification UX

#### Pattern: **Instant Verification Link**

**Flow:**
1. User enters email
2. System sends verification email immediately
3. User clicks link → auto-login
4. No separate "verify your email" page

**Email Template Structure:**
```
Subject: Welcome to Hoostn - Click to sign in

Hi there! 👋

Click the button below to sign in to Hoostn:

[Sign In to Hoostn] (Large, green accent button)

This link expires in 15 minutes.

If you didn't request this, you can safely ignore this email.

---
Hoostn - Your smart way to manage vacation rentals
```

**In-App Verification State:**

```typescript
// Show verification pending state
<Card>
  <div className="text-center">
    <MailIcon className="mx-auto h-12 w-12 text-accent" />
    <h2>Check your email</h2>
    <p>We sent a sign-in link to:<br />
       <strong>user@example.com</strong>
    </p>
    <Button variant="ghost" onClick={resendEmail}>
      Didn't receive it? Resend
    </Button>
  </div>
</Card>
```

**Best Practices:**
- Show email address user entered (allow editing)
- Clear expiration time (15 minutes standard)
- Prominent resend button (enabled after 30 seconds)
- Check spam folder reminder
- Open email app button (mobile only)

---

### 1.4 Loading States & Feedback

#### Principle: **Always Communicate System State**

**Loading States:**

```typescript
// Button states
<Button 
  variant="primary"
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <Spinner className="mr-2" />
      Sending magic link...
    </>
  ) : (
    'Send Magic Link'
  )}
</Button>
```

**State Transitions:**

1. **Idle:** Ready to submit
2. **Validating:** Check email format
3. **Submitting:** Send to server
4. **Sent:** Show success message
5. **Error:** Show specific error

**Visual Feedback:**
- Spinner + text for loading
- Checkmark + text for success
- Error icon + text for errors
- Smooth transitions (200ms)

**Example States:**

| State | Button Text | Icon | Color |
|-------|-------------|------|-------|
| Idle | "Send Magic Link" | → | Primary |
| Loading | "Sending..." | ⟳ | Primary (disabled) |
| Success | "Email sent! Check inbox" | ✓ | Accent |
| Error | "Try again" | ⚠ | Error |

---

### 1.5 Error Handling & Messaging

#### Principle: **Be Specific, Helpful, and Human**

**Error Message Categories:**

**1. Validation Errors (Client-side)**
```typescript
// Bad
"Invalid input"

// Good
"Please enter a valid email address"
"Email must be from your company domain"
```

**2. Authentication Errors**
```typescript
// Bad
"Authentication failed"

// Good - Security conscious
"We couldn't find an account with that email"
"This magic link has expired. Request a new one?"

// Never reveal:
"Wrong password" → Instead: "Email or password incorrect"
```

**3. Network Errors**
```typescript
// Bad
"Error 500"

// Good
"We're having trouble connecting. Check your internet and try again."
```

**4. Rate Limiting**
```typescript
"Too many sign-in attempts. Please wait 5 minutes and try again."
```

**Error Display Pattern:**

```typescript
// Inline errors (preferred)
<Input 
  error={errors.email}
  aria-invalid={!!errors.email}
  aria-describedby="email-error"
/>
{errors.email && (
  <p id="email-error" className="mt-1 text-sm text-error">
    <AlertIcon className="inline mr-1" />
    {errors.email}
  </p>
)}
```

**Error Message Guidelines:**
- ✅ Tell what went wrong
- ✅ Suggest how to fix it
- ✅ Use plain language
- ✅ Be empathetic
- ❌ Don't blame the user
- ❌ Don't use jargon
- ❌ Don't reveal security details

---

### 1.6 Redirect Flows After Authentication

#### Pattern: **Smart Redirects with Intent Preservation**

**Redirect Priority:**

```typescript
1. Intended destination (from ?redirect= param)
2. Deep link (from email/notification)
3. Onboarding (if new user)
4. Dashboard (default for existing users)
5. Last visited page (from session)
```

**Implementation:**

```typescript
// Store intended destination
const handleSignIn = async (email: string) => {
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  await signIn(email, {
    callbackUrl: redirectTo,
  });
};

// Preserve state across auth
sessionStorage.setItem('auth_redirect', window.location.pathname);
```

**UX Patterns:**

**1. Direct Access (no redirect needed)**
```
User clicks "Sign In" → Auth flow → Dashboard
```

**2. Protected Resource Access**
```
User tries to access /properties/123 → 
Redirect to /login?redirect=/properties/123 →
Auth flow →
Redirect to /properties/123
```

**3. New User Onboarding**
```
New user signs up →
Auth flow →
Redirect to /onboarding/profile →
Then to intended destination
```

**Best Practices:**
- Validate redirect URLs (prevent open redirects)
- Show "Redirecting..." state (brief)
- Use 302 redirects, not JavaScript (better for screen readers)
- Clear any temporary auth state after redirect

---

## 2. Form Design Best Practices

### 2.1 Input Validation Patterns

#### Recommendation: **Hybrid Validation Approach**

**Validation Strategy:**

```typescript
1. On blur: Validate completed field
2. On submit: Validate entire form
3. On change (after first error): Live validation for fixing
```

**Email Validation Pattern:**

```typescript
// Progressive validation
const validateEmail = (email: string) => {
  // Level 1: Format check
  if (!email) return 'Email is required';
  
  // Level 2: Basic format
  if (!email.includes('@')) return 'Email must contain @';
  
  // Level 3: RFC-compliant regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email';
  
  // Level 4: Domain validation (optional, async)
  // Check if domain exists (MX record lookup)
  
  return null; // Valid
};
```

**Password Validation (if using passwords):**

```typescript
const validatePassword = (password: string) => {
  const rules = {
    minLength: password.length >= 12,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  };
  
  // Show strength meter, not blocking validation
  return rules;
};
```

**Visual Validation States:**

```typescript
// Input states
<Input
  state={
    error ? 'error' :
    isValidating ? 'validating' :
    isValid ? 'success' :
    'default'
  }
/>
```

---

### 2.2 Real-time vs On-Submit Validation

#### Recommended Pattern: **Contextual Validation**

**When to Use Each:**

| Validation Type | Use Case | Example |
|----------------|----------|---------|
| Real-time | Password strength | Show meter as user types |
| On-blur | Email format | Validate when user leaves field |
| On-submit | Final check | Ensure all fields valid |
| Async | Email existence | Check if email already registered |

**Implementation:**

```typescript
const useFormValidation = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Validate this field
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = validateAllFields(formData);
    
    if (Object.keys(newErrors).length === 0) {
      // Submit form
      await onSubmit(formData);
    } else {
      setErrors(newErrors);
      // Focus first error
      focusFirstError(newErrors);
    }
  };
  
  return { errors, touched, handleBlur, handleSubmit };
};
```

**Best Practices:**
- Don't show errors before user interaction
- Real-time validation for complex requirements (passwords)
- Debounce expensive validations (300ms)
- Show success states sparingly (checkmark on valid email)

---

### 2.3 Error Message Placement

#### Pattern: **Inline Errors, Contextual Positioning**

**Recommended Approach:**

```typescript
// Input with inline error
<div className="space-y-1">
  <Label htmlFor="email">Email address</Label>
  <Input
    id="email"
    type="email"
    error={errors.email}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-error flex items-start gap-1">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{errors.email}</span>
    </p>
  )}
</div>
```

**Error Placement Rules:**

1. **Field-level errors:** Below the input
2. **Form-level errors:** Top of form (summary)
3. **Critical errors:** Modal or toast
4. **Network errors:** Top banner (persistent)

**Visual Hierarchy:**

```
┌─────────────────────────────────────┐
│  ⚠️ Please fix 2 errors below       │ ← Form-level summary
├─────────────────────────────────────┤
│  Email                              │
│  [user@example.com]                 │
│  ✓ Valid                            │ ← Success indicator
│                                     │
│  Password                           │
│  [********]                         │ ← Error state border
│  ⚠️ Password must be 12+ characters │ ← Inline error
│                                     │
│  [Sign In]                          │
└─────────────────────────────────────┘
```

---

### 2.4 Accessibility (WCAG 2.1 AA)

#### Requirement: **Full WCAG 2.1 Level AA Compliance**

**Essential ARIA Attributes:**

```typescript
// Login form with proper ARIA
<form 
  onSubmit={handleSubmit}
  aria-label="Sign in to your account"
  noValidate // We'll handle validation
>
  <div>
    <label htmlFor="email" className="block text-sm font-medium">
      Email address
      <span className="text-error" aria-label="required">*</span>
    </label>
    <input
      id="email"
      name="email"
      type="email"
      autoComplete="email"
      required
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? 'email-error' : 'email-hint'}
    />
    <p id="email-hint" className="text-sm text-gray-600">
      We'll send you a magic link
    </p>
    {errors.email && (
      <p id="email-error" role="alert" className="text-error">
        {errors.email}
      </p>
    )}
  </div>
  
  <button 
    type="submit"
    aria-busy={isLoading}
    disabled={isLoading}
  >
    {isLoading ? 'Sending...' : 'Send Magic Link'}
  </button>
</form>
```

**Accessibility Checklist:**

- [ ] All inputs have associated `<label>` elements
- [ ] Error messages use `role="alert"` for screen readers
- [ ] Focus indicators clearly visible (3px accent border)
- [ ] Color not sole indicator (use icons + text)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Skip to main content link available
- [ ] Loading states announced to screen readers
- [ ] Touch targets 44x44px minimum
- [ ] Text contrast ratio 4.5:1 minimum
- [ ] Form can be completed with keyboard only

**Focus Management:**

```typescript
// Focus first error on submit
const focusFirstError = (errors: Record<string, string>) => {
  const firstErrorField = Object.keys(errors)[0];
  const element = document.getElementById(firstErrorField);
  element?.focus();
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Trap focus in modal
useFocusTrap(modalRef, isOpen);
```

---

### 2.5 Mobile-Friendly Forms

#### Pattern: **Mobile-First, Touch-Optimized**

**Mobile Optimizations:**

```typescript
// 1. Appropriate input types
<input type="email" /> // Shows email keyboard
<input type="tel" />   // Shows number pad
<input type="text" inputMode="numeric" /> // Number keyboard, text context

// 2. Autocomplete attributes
<input 
  type="email"
  autoComplete="email"
  autoCapitalize="off"
  autoCorrect="off"
  spellCheck="false"
/>

// 3. Touch-friendly sizing
<Button className="min-h-[44px] px-6"> // 44px min touch target
  Sign In
</Button>

// 4. Prevent zoom on input focus (iOS)
// In viewport meta tag:
// maximum-scale=1 (only if inputs are 16px+)
```

**Mobile Layout:**

```typescript
// Stack labels above inputs
<div className="space-y-4">
  <div>
    <Label className="block mb-2">Email</Label>
    <Input className="w-full" />
  </div>
  
  <Button className="w-full"> // Full-width on mobile
    Send Magic Link
  </Button>
</div>
```

**Mobile-Specific Features:**

1. **Open Email App Button:**
```typescript
{isMobile && emailSent && (
  <Button 
    variant="outline"
    onClick={() => window.location.href = 'mailto:'}
  >
    Open Email App
  </Button>
)}
```

2. **Biometric Authentication (future):**
```typescript
// WebAuthn API for Face ID / Fingerprint
if (window.PublicKeyCredential) {
  // Enable biometric auth
}
```

---

### 2.6 Progressive Enhancement

#### Pattern: **Works Without JavaScript, Better With It**

**Base HTML Form (No JS):**

```html
<!-- Server-side rendered form -->
<form action="/api/auth/signin" method="POST">
  <label for="email">Email</label>
  <input 
    type="email" 
    id="email" 
    name="email" 
    required 
  />
  
  <button type="submit">Sign In</button>
</form>
```

**Enhanced with JavaScript:**

```typescript
// Layer on enhancements
useEffect(() => {
  // Add live validation
  // Add loading states
  // Add optimistic UI
  // Add keyboard shortcuts
}, []);

// Graceful degradation
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault(); // Only if JS works
  
  if (!navigator.onLine) {
    // Fall back to native form submission
    e.target.submit();
    return;
  }
  
  // Enhanced AJAX submission
  await submitViaAPI();
};
```

**Progressive Enhancement Checklist:**

- [x] Form works with POST submission (no JS)
- [x] Server-side validation matches client-side
- [x] Error messages work without JS
- [x] Success redirects work without JS
- [x] Enhanced with better UX when JS available

---

## 3. Security Best Practices

### 3.1 CSRF Protection in Next.js

#### Pattern: **Token-Based CSRF Protection**

**Implementation with next-auth:**

```typescript
// next-auth handles CSRF automatically
// But for custom forms:

// pages/api/auth/custom-action.ts
import { getCsrfToken } from 'next-auth/react';

export default async function handler(req, res) {
  // Verify CSRF token
  const csrfToken = req.body.csrfToken;
  const expectedToken = await getCsrfToken({ req });
  
  if (csrfToken !== expectedToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Process request
}

// In your component
import { getCsrfToken } from 'next-auth/react';

const SignInForm = () => {
  const [csrfToken, setCsrfToken] = useState('');
  
  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      {/* Rest of form */}
    </form>
  );
};
```

**Additional CSRF Protections:**

```typescript
// 1. SameSite cookies (default in Next.js)
res.setHeader(
  'Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Lax`
);

// 2. Origin checking
const origin = req.headers.origin;
const allowedOrigins = ['https://hoostn.com', 'https://app.hoostn.com'];
if (!allowedOrigins.includes(origin)) {
  return res.status(403).json({ error: 'Forbidden' });
}

// 3. Custom headers
if (req.method !== 'GET' && !req.headers['x-requested-with']) {
  return res.status(403).json({ error: 'Missing required header' });
}
```

---

### 3.2 Rate Limiting Strategies

#### Pattern: **Multi-Layer Rate Limiting**

**Implementation Layers:**

**1. Edge Rate Limiting (Cloudflare/Vercel):**
```typescript
// Vercel edge config
{
  "headers": [{
    "source": "/api/auth/:path*",
    "headers": [{
      "key": "X-RateLimit-Limit",
      "value": "5"
    }]
  }]
}
```

**2. Application Rate Limiting:**

```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function rateLimit(
  identifier: string,
  limit: number = 5,
  window: number = 60 // seconds
) {
  const key = `rate_limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  if (count > limit) {
    const ttl = await redis.ttl(key);
    throw new RateLimitError(`Too many requests. Try again in ${ttl}s`);
  }
  
  return {
    remaining: limit - count,
    reset: Date.now() + (window * 1000),
  };
}

// Usage in API route
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  try {
    const { remaining, reset } = await rateLimit(ip, 5, 60);
    
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);
    
    // Process request
  } catch (error) {
    if (error instanceof RateLimitError) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((error.reset - Date.now()) / 1000),
      });
    }
  }
}
```

**3. Per-Email Rate Limiting:**

```typescript
// Prevent email enumeration
const emailKey = `email:${email.toLowerCase()}`;
await rateLimit(emailKey, 3, 600); // 3 attempts per 10 min
```

**Rate Limit Strategy:**

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| /api/auth/signin | 5 | 15 min | IP |
| /api/auth/magic-link | 3 | 10 min | Email |
| /api/auth/verify | 10 | 1 hour | Token |
| /api/auth/signup | 3 | 1 hour | IP |

---

### 3.3 Brute Force Protection

#### Pattern: **Progressive Delays + Account Lockout**

**Implementation:**

```typescript
// lib/brute-force-protection.ts
interface LoginAttempt {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export async function checkBruteForce(
  email: string
): Promise<{ allowed: boolean; delay: number }> {
  const key = `login:${email.toLowerCase()}`;
  const data = await redis.get<LoginAttempt>(key);
  
  if (!data) {
    return { allowed: true, delay: 0 };
  }
  
  // Check if account is locked
  if (data.lockedUntil && Date.now() < data.lockedUntil) {
    const remainingTime = Math.ceil((data.lockedUntil - Date.now()) / 1000);
    return { 
      allowed: false, 
      delay: remainingTime 
    };
  }
  
  // Progressive delay based on attempts
  const delays = [0, 1, 2, 5, 10, 30]; // seconds
  const delay = delays[Math.min(data.attempts, delays.length - 1)];
  
  // Lock after 10 failed attempts
  if (data.attempts >= 10) {
    const lockDuration = 30 * 60 * 1000; // 30 minutes
    await redis.set(key, {
      ...data,
      lockedUntil: Date.now() + lockDuration,
    }, { ex: 1800 });
    
    return { allowed: false, delay: 1800 };
  }
  
  return { allowed: true, delay };
}

export async function recordLoginAttempt(
  email: string,
  success: boolean
) {
  const key = `login:${email.toLowerCase()}`;
  
  if (success) {
    // Clear attempts on successful login
    await redis.del(key);
  } else {
    // Increment failed attempts
    const data = await redis.get<LoginAttempt>(key) || {
      attempts: 0,
      lastAttempt: Date.now(),
    };
    
    await redis.set(key, {
      attempts: data.attempts + 1,
      lastAttempt: Date.now(),
    }, { ex: 3600 }); // Expire after 1 hour
  }
}
```

**Usage in Auth Flow:**

```typescript
// API route
export default async function handler(req, res) {
  const { email } = req.body;
  
  // Check brute force
  const { allowed, delay } = await checkBruteForce(email);
  
  if (!allowed) {
    return res.status(429).json({
      error: 'Too many failed attempts',
      retryAfter: delay,
      message: `Account temporarily locked. Try again in ${Math.ceil(delay / 60)} minutes.`,
    });
  }
  
  // Attempt authentication
  const success = await authenticateUser(email);
  
  // Record attempt
  await recordLoginAttempt(email, success);
  
  if (success) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({
      error: 'Authentication failed',
    });
  }
}
```

**User Notification:**

```typescript
// Show progressive feedback
if (attempt > 3) {
  toast.warning(`Failed attempt ${attempt}/10. Account will lock after 10 attempts.`);
}

if (locked) {
  toast.error(`Too many failed attempts. Your account is locked for 30 minutes.`);
}
```

---

### 3.4 Session Security

#### Pattern: **Secure, HttpOnly, Short-Lived Sessions**

**Session Configuration:**

```typescript
// next-auth configuration
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // Refresh daily
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
    // Automatic rotation on update
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // HTTPS only
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Add custom claims
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      
      // Token rotation: generate new token
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Pass token data to session
      session.user.id = token.userId;
      session.user.role = token.role;
      
      return session;
    },
  },
};
```

**Session Security Features:**

**1. Automatic Token Rotation:**
```typescript
// Rotate tokens on each request (after updateAge)
// Prevents session fixation attacks
```

**2. Device Tracking:**
```typescript
interface Session {
  userId: string;
  deviceId: string;
  userAgent: string;
  ip: string;
  createdAt: Date;
  lastActive: Date;
}

// Store active sessions in database
await db.session.create({
  userId: user.id,
  deviceId: generateDeviceId(req),
  userAgent: req.headers['user-agent'],
  ip: getClientIp(req),
});
```

**3. Concurrent Session Limits:**
```typescript
// Limit to 5 active sessions per user
const sessions = await db.session.findMany({
  where: { userId: user.id },
  orderBy: { lastActive: 'desc' },
});

if (sessions.length >= 5) {
  // Delete oldest session
  await db.session.delete({ 
    where: { id: sessions[4].id } 
  });
}
```

**4. Session Invalidation:**
```typescript
// On password change, logout all devices
await db.session.deleteMany({
  where: { userId: user.id },
});

// On logout, delete current session
await signOut({ callbackUrl: '/' });
```

---

### 3.5 Secure Cookie Configuration

#### Pattern: **Defense in Depth Cookie Security**

**Recommended Cookie Settings:**

```typescript
// Secure cookie configuration
const secureCookieOptions = {
  httpOnly: true,      // Prevents XSS access
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  domain: '.hoostn.com', // Allow subdomains
};

// Set cookie
res.setHeader('Set-Cookie', [
  serialize('session', token, secureCookieOptions),
  // Additional security headers
  serialize('__Host-csrf', csrfToken, {
    ...secureCookieOptions,
    sameSite: 'strict',
    path: '/',
    // __Host- prefix requires:
    // - Secure flag
    // - No domain attribute
    // - Path must be /
  }),
]);
```

**Cookie Prefixes:**

```typescript
// __Secure- prefix: requires Secure flag
__Secure-session-token

// __Host- prefix: requires Secure, no Domain, Path=/
__Host-csrf-token
```

**Cookie Security Headers:**

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Strict CSP
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
```

**Cookie Rotation:**

```typescript
// Rotate session cookies periodically
const shouldRotate = Date.now() - session.createdAt > 24 * 60 * 60 * 1000;

if (shouldRotate) {
  const newToken = await generateNewToken(session);
  res.setHeader('Set-Cookie', serialize('session', newToken, secureCookieOptions));
}
```

---

## 4. Modern Authentication Patterns

### 4.1 OAuth Integration Patterns (Future)

#### Pattern: **OAuth as Enhancement, Not Requirement**

**Recommended OAuth Providers:**

1. **Google** (Priority 1) - Universal, trusted
2. **Microsoft** (Priority 2) - B2B market
3. **Apple** (Priority 3) - iOS users

**Implementation Strategy:**

```typescript
// next-auth with OAuth providers
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: "select_account",
        access_type: "offline",
        response_type: "code",
      },
    },
  }),
  MicrosoftProvider({
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authorization: {
      params: {
        scope: "openid profile email User.Read",
      },
    },
  }),
],
```

**OAuth UX Pattern:**

```
┌────────────────────────────────────────┐
│  Sign in to Hoostn                     │
├────────────────────────────────────────┤
│                                        │
│  [Continue with Google]    (icon)     │
│  [Continue with Microsoft] (icon)     │
│                                        │
│  ──────── or ────────                 │
│                                        │
│  Email address                         │
│  [user@example.com]                    │
│                                        │
│  [Continue with Email]                 │
│                                        │
│  New to Hoostn? Create account        │
└────────────────────────────────────────┘
```

**Best Practices:**

- OAuth buttons above email form (higher prominence)
- Clear provider branding (official logos, colors)
- "Continue with" not "Sign in with" (less intimidating)
- Handle OAuth errors gracefully
- Link OAuth accounts to existing email accounts

**Account Linking:**

```typescript
// If OAuth email matches existing account
const existingUser = await db.user.findUnique({
  where: { email: profile.email },
});

if (existingUser) {
  // Link OAuth account
  await db.account.create({
    data: {
      userId: existingUser.id,
      type: 'oauth',
      provider: 'google',
      providerAccountId: profile.id,
    },
  });
}
```

---

### 4.2 Social Login UX

#### Pattern: **One-Click Social Authentication**

**Visual Design:**

```typescript
// Social login button component
<Button
  variant="outline"
  className="w-full justify-start gap-3 border-gray-300 hover:bg-gray-50"
  onClick={() => signIn('google')}
>
  <GoogleIcon className="h-5 w-5" />
  <span className="flex-1 text-left">Continue with Google</span>
</Button>
```

**Loading States:**

```typescript
const [provider, setProvider] = useState<string | null>(null);

<Button
  onClick={() => {
    setProvider('google');
    signIn('google');
  }}
  disabled={!!provider}
>
  {provider === 'google' ? (
    <>
      <Spinner className="mr-2" />
      Connecting to Google...
    </>
  ) : (
    <>
      <GoogleIcon className="mr-2" />
      Continue with Google
    </>
  )}
</Button>
```

**Error Handling:**

```typescript
// Handle OAuth errors
const { error } = useSearchParams();

if (error === 'OAuthAccountNotLinked') {
  toast.error('This email is already registered. Please sign in with email.');
}

if (error === 'OAuthCallback') {
  toast.error('There was a problem signing in. Please try again.');
}
```

**Privacy & Permissions:**

```
┌────────────────────────────────────────┐
│  Continue with Google                  │
├────────────────────────────────────────┤
│  Hoostn will receive:                  │
│  • Your name                           │
│  • Email address                       │
│  • Profile picture                     │
│                                        │
│  We won't post without permission.     │
│                                        │
│  [Continue] [Cancel]                   │
└────────────────────────────────────────┘
```

---

### 4.3 Remember Me Functionality

#### Pattern: **Secure Long-Lived Sessions**

**Implementation:**

```typescript
// Optional "Remember me" checkbox
<Checkbox
  id="remember"
  checked={rememberMe}
  onChange={setRememberMe}
/>
<label htmlFor="remember">
  Keep me signed in for 30 days
</label>

// Adjust session duration
const sessionMaxAge = rememberMe 
  ? 30 * 24 * 60 * 60  // 30 days
  : 24 * 60 * 60;       // 1 day

await signIn('credentials', {
  email,
  password,
  remember: rememberMe,
});
```

**Security Considerations:**

```typescript
// Store "remember me" preference securely
const rememberToken = await generateSecureToken();

// Store in database with device info
await db.rememberToken.create({
  data: {
    userId: user.id,
    token: await hash(rememberToken),
    deviceId: getDeviceId(req),
    userAgent: req.headers['user-agent'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
});

// Set separate cookie
res.setHeader('Set-Cookie', serialize('remember_token', rememberToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
}));
```

**Auto-Login Flow:**

```typescript
// Check for remember token on page load
useEffect(() => {
  const checkRememberToken = async () => {
    const token = getCookie('remember_token');
    
    if (token && !session) {
      // Validate and auto-login
      await signIn('remember-token', { token });
    }
  };
  
  checkRememberToken();
}, []);
```

**User Control:**

```
Settings > Security > Active Sessions

┌────────────────────────────────────────┐
│  This device (Current)                 │
│  Chrome on MacOS • San Francisco, CA   │
│  Last active: Just now                 │
│  [Keep signed in: ON] [Sign out]      │
├────────────────────────────────────────┤
│  iPhone 14 Pro                         │
│  Safari • Last active: 2 days ago      │
│  [Revoke access]                       │
└────────────────────────────────────────┘
```

---

### 4.4 Multi-Device Session Management

#### Pattern: **Transparent Multi-Device Support**

**Session List View:**

```typescript
// pages/settings/sessions.tsx
const ActiveSessions = () => {
  const { data: sessions } = useSessions();
  
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <DeviceIcon device={session.device} />
              <div>
                <p className="font-medium">
                  {session.deviceName}
                  {session.isCurrent && (
                    <Badge className="ml-2">Current</Badge>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {session.browser} • {session.os}
                </p>
                <p className="text-sm text-gray-500">
                  {session.location} • {formatDate(session.lastActive)}
                </p>
              </div>
            </div>
            
            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSession(session.id)}
              >
                Revoke
              </Button>
            )}
          </div>
        </Card>
      ))}
      
      <Button variant="outline" onClick={revokeAllOtherSessions}>
        Sign out all other devices
      </Button>
    </div>
  );
};
```

**Device Recognition:**

```typescript
// Generate stable device ID
const generateDeviceId = (req: Request): string => {
  const ua = req.headers['user-agent'];
  const ip = getClientIp(req);
  
  // Create fingerprint from user agent + IP
  const fingerprint = `${ua}:${ip}`;
  return createHash('sha256').update(fingerprint).digest('hex');
};

// Parse device info
const parseUserAgent = (ua: string) => {
  const parser = new UAParser(ua);
  return {
    browser: parser.getBrowser().name,
    os: parser.getOS().name,
    device: parser.getDevice().type || 'desktop',
    deviceName: getDeviceName(parser),
  };
};
```

**New Device Notification:**

```typescript
// Email notification on new device login
const sendNewDeviceEmail = async (user: User, session: Session) => {
  await sendEmail({
    to: user.email,
    subject: 'New sign-in to your Hoostn account',
    template: 'new-device',
    data: {
      name: user.name,
      device: session.deviceName,
      location: session.location,
      time: session.createdAt,
      secureAccountUrl: 'https://app.hoostn.com/settings/security',
    },
  });
};
```

**Sync Across Devices:**

```typescript
// Use WebSocket for real-time sync
const syncSessionState = (userId: string) => {
  pusher.trigger(`user-${userId}`, 'session-updated', {
    action: 'login',
    deviceId: currentDeviceId,
  });
};

// Listen for updates
useEffect(() => {
  const channel = pusher.subscribe(`user-${user.id}`);
  
  channel.bind('session-updated', (data) => {
    if (data.action === 'logout' && data.deviceId !== currentDeviceId) {
      toast.info('You signed out from another device');
      // Optionally refresh session status
    }
  });
  
  return () => channel.unsubscribe();
}, [user.id]);
```

---

### 4.5 Account Recovery Flows

#### Pattern: **Secure, User-Friendly Recovery**

**Recovery Flow Options:**

1. **Magic Link (Primary)** - Works for passwordless accounts
2. **Password Reset** - For password-based accounts
3. **Backup Codes** - For high-security accounts (future)
4. **Support Contact** - Last resort

**Magic Link Recovery:**

```
User Flow:
1. Click "Can't sign in?"
2. Enter email
3. Receive recovery email
4. Click link → Auto sign-in
5. Update security settings
```

**Password Reset Flow:**

```typescript
// pages/forgot-password.tsx
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Send reset email
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    // Always show success (prevent email enumeration)
    setSent(true);
  };
  
  if (sent) {
    return (
      <Card>
        <MailIcon />
        <h2>Check your email</h2>
        <p>
          If an account exists for {email}, 
          you'll receive a password reset link.
        </p>
      </Card>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h1>Reset your password</h1>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <Button type="submit">Send reset link</Button>
    </form>
  );
};
```

**Reset Link Generation:**

```typescript
// API route: /api/auth/reset-password
export default async function handler(req, res) {
  const { email } = req.body;
  
  // Find user
  const user = await db.user.findUnique({ where: { email } });
  
  if (!user) {
    // Don't reveal if user exists (security)
    return res.json({ success: true });
  }
  
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = await hash(token);
  
  // Store token with expiration
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });
  
  // Send email
  await sendEmail({
    to: email,
    subject: 'Reset your Hoostn password',
    template: 'password-reset',
    data: {
      name: user.name,
      resetUrl: `https://app.hoostn.com/reset-password?token=${token}`,
      expiresIn: '1 hour',
    },
  });
  
  res.json({ success: true });
}
```

**Email Template:**

```html
Subject: Reset your Hoostn password

Hi {{name}},

We received a request to reset your password.

Click the button below to create a new password:

[Reset Password] (Green button, large)

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

---
Hoostn - Your smart way to manage vacation rentals
```

**Security Best Practices:**

- Token valid for 1 hour only
- Single-use tokens (invalidate after use)
- Rate limit reset requests (3 per hour per email)
- Log all reset attempts
- Notify user of successful password change
- Don't reveal if email exists (timing-attack resistant)

---

## 5. Tailwind UI Implementation

### 5.1 Brand Colors Implementation

**Hoostn Color Palette:**

```typescript
// Already configured in tailwind.config.js
colors: {
  primary: {
    DEFAULT: '#1F3A8A',  // Hoostn Blue
    dark: '#2E4CCB',     // Hover state
    light: '#3559C8',    // Light variant
  },
  accent: {
    DEFAULT: '#00C48C',  // Hoostn Green (success)
    dark: '#009F72',     // Hover state
  },
  gray: {
    anthracite: '#333333', // Text
    light: '#F5F6F8',      // Backgrounds
  },
  error: '#E53E3E',        // Errors
}
```

**Usage in Auth Components:**

```typescript
// Primary CTA (main action)
<Button variant="primary"> // Uses #1F3A8A
  Send Magic Link
</Button>

// Success states
<Button variant="accent">  // Uses #00C48C
  ✓ Email Verified
</Button>

// Outline buttons (secondary actions)
<Button variant="outline">
  Sign in with password instead
</Button>

// Error messages
<p className="text-error">    // Uses #E53E3E
  Invalid email address
</p>
```

---

### 5.2 Authentication Page Layouts

#### Layout 1: **Centered Card (Recommended)**

```typescript
// app/(auth)/login/page.tsx
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-light px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="mx-auto h-12 w-auto" />
          <h1 className="mt-6 text-3xl font-bold text-gray-anthracite">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Hoostn account
          </p>
        </div>
        
        {/* Auth Card */}
        <Card className="p-8">
          <SignInForm />
        </Card>
        
        {/* Footer Links */}
        <p className="mt-4 text-center text-sm text-gray-600">
          New to Hoostn?{' '}
          <Link href="/signup" className="text-primary hover:text-primary-dark">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Visual Design:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│            [Hoostn Logo]                        │
│         Welcome back to Hoostn                  │
│     Sign in to manage your properties           │
│                                                 │
│  ┌────────────────────────────────────────┐   │
│  │                                        │   │
│  │  Email address                         │   │
│  │  [user@example.com      ]             │   │
│  │                                        │   │
│  │  [Send Magic Link]   (full-width)     │   │
│  │                                        │   │
│  │  ────────── or ──────────             │   │
│  │                                        │   │
│  │  [Sign in with password instead]      │   │
│  │                                        │   │
│  └────────────────────────────────────────┘   │
│                                                 │
│     New to Hoostn? Create an account           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Layout 2: **Split Screen (Alternative)**

```typescript
// For marketing-heavy auth pages
export default function SignUpPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Logo className="h-10 w-auto" />
          <h1 className="mt-8 text-4xl font-bold">
            Start managing your vacation rentals
          </h1>
          
          <Card className="mt-8 p-8">
            <SignUpForm />
          </Card>
        </div>
      </div>
      
      {/* Right: Marketing */}
      <div className="hidden lg:flex items-center justify-center bg-primary p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">
            Trusted by 10,000+ property managers
          </h2>
          <Testimonials />
        </div>
      </div>
    </div>
  );
}
```

---

### 5.3 Form Component Patterns

#### Input Component with Hoostn Styling:

```typescript
// components/ui/input.tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    const id = props.id || props.name;
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={id}
            className="block text-sm font-medium text-gray-anthracite"
          >
            {label}
            {props.required && (
              <span className="text-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <input
          ref={ref}
          id={id}
          className={clsx(
            'block w-full rounded-lg border px-4 py-3',
            'text-gray-anthracite placeholder:text-gray-400',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            {
              'border-gray-300 focus:border-accent focus:ring-accent': !error,
              'border-error focus:border-error focus:ring-error': error,
            },
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        
        {hint && !error && (
          <p id={`${id}-hint`} className="text-sm text-gray-600">
            {hint}
          </p>
        )}
        
        {error && (
          <p 
            id={`${id}-error`}
            role="alert"
            className="text-sm text-error flex items-start gap-1"
          >
            <AlertCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**Usage:**

```typescript
<Input
  label="Email address"
  type="email"
  name="email"
  placeholder="you@example.com"
  required
  error={errors.email}
  hint="We'll send you a magic link to sign in"
/>
```

---

### 5.4 Button States & Variants

**Enhanced Button Component:**

```typescript
// components/ui/button.tsx (enhanced)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          // Variants
          'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-sm':
            variant === 'primary',
          'bg-accent text-white hover:bg-accent-dark focus:ring-accent shadow-sm':
            variant === 'accent',
          'border-2 border-gray-300 bg-white text-gray-anthracite hover:bg-gray-50 focus:ring-primary':
            variant === 'outline',
          'bg-transparent text-gray-anthracite hover:bg-gray-100 focus:ring-gray-300':
            variant === 'ghost',
          
          // Sizes
          'px-3 py-1.5 text-sm rounded-lg': size === 'sm',
          'px-6 py-3 text-base rounded-2xl': size === 'md',
          'px-8 py-4 text-lg rounded-2xl': size === 'lg',
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// Spinner component
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={clsx('animate-spin', className)}
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
);
```

**Button Examples:**

```typescript
// Primary action
<Button variant="primary" size="lg">
  Send Magic Link
</Button>

// Loading state
<Button variant="primary" loading>
  Sending...
</Button>

// With icon
<Button variant="accent" leftIcon={<CheckIcon />}>
  Email Verified
</Button>

// Secondary action
<Button variant="outline">
  Sign in with password
</Button>

// Tertiary action
<Button variant="ghost" size="sm">
  Resend email
</Button>
```

---

### 5.5 Card Layouts for Auth Pages

**Auth Card Variants:**

```typescript
// 1. Basic Auth Card
<Card className="w-full max-w-md p-8">
  <CardHeader>
    <CardTitle>Sign in to Hoostn</CardTitle>
  </CardHeader>
  <CardContent>
    <SignInForm />
  </CardContent>
</Card>

// 2. Multi-Step Auth Card with Progress
<Card className="w-full max-w-md">
  <div className="border-b border-gray-200 p-6">
    <ProgressSteps current={1} total={3} />
  </div>
  <div className="p-8">
    <StepContent />
  </div>
</Card>

// 3. Social Auth Card
<Card className="w-full max-w-md p-8">
  <div className="space-y-3">
    <Button variant="outline" className="w-full justify-start gap-3">
      <GoogleIcon />
      Continue with Google
    </Button>
    <Button variant="outline" className="w-full justify-start gap-3">
      <MicrosoftIcon />
      Continue with Microsoft
    </Button>
  </div>
  
  <Divider text="or" className="my-6" />
  
  <EmailForm />
</Card>
```

**Divider Component:**

```typescript
// components/ui/divider.tsx
export const Divider = ({ 
  text, 
  className 
}: { 
  text?: string; 
  className?: string 
}) => (
  <div className={clsx('relative', className)}>
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    {text && (
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-4 text-gray-600">{text}</span>
      </div>
    )}
  </div>
);
```

---

## 6. Component Architecture

### 6.1 Recommended Component Structure

```
apps/web/
├── app/
│   ├── (auth)/                    # Auth layout group
│   │   ├── layout.tsx             # Auth layout wrapper
│   │   ├── login/
│   │   │   └── page.tsx           # Sign in page
│   │   ├── signup/
│   │   │   └── page.tsx           # Sign up page
│   │   ├── verify-email/
│   │   │   └── page.tsx           # Email verification
│   │   ├── forgot-password/
│   │   │   └── page.tsx           # Password reset request
│   │   └── reset-password/
│   │       └── page.tsx           # Password reset form
│   │
│   └── api/
│       └── auth/
│           ├── [...nextauth]/
│           │   └── route.ts       # NextAuth config
│           ├── signin/
│           │   └── route.ts       # Custom sign-in API
│           ├── signup/
│           │   └── route.ts       # User registration
│           ├── verify-email/
│           │   └── route.ts       # Email verification
│           └── reset-password/
│               └── route.ts       # Password reset
│
├── components/
│   ├── auth/                      # Auth-specific components
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   ├── MagicLinkForm.tsx
│   │   ├── PasswordForm.tsx
│   │   ├── SocialLoginButtons.tsx
│   │   ├── EmailVerificationCard.tsx
│   │   └── PasswordResetForm.tsx
│   │
│   └── ui/                        # Base UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── checkbox.tsx
│       ├── divider.tsx
│       └── spinner.tsx
│
├── lib/
│   ├── auth/                      # Auth utilities
│   │   ├── config.ts              # NextAuth configuration
│   │   ├── session.ts             # Session management
│   │   ├── magic-link.ts          # Magic link generation
│   │   ├── rate-limit.ts          # Rate limiting
│   │   └── brute-force.ts         # Brute force protection
│   │
│   ├── validations/               # Form validation schemas
│   │   ├── auth.ts                # Auth validation rules
│   │   └── index.ts
│   │
│   └── hooks/                     # Custom hooks
│       ├── useAuth.ts             # Auth state hook
│       ├── useFormValidation.ts   # Form validation hook
│       └── useSession.ts          # Session hook
│
└── types/
    └── auth.ts                    # Auth-related types
```

---

### 6.2 Example Component Implementation

**SignInForm Component:**

```typescript
// components/auth/SignInForm.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { SocialLoginButtons } from './SocialLoginButtons';
import { validateEmail } from '@/lib/validations/auth';

export const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    
    setLoading(true);
    
    try {
      // Send magic link
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          redirect: searchParams.get('redirect') || '/dashboard',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }
      
      setEmailSent(true);
    } catch (error) {
      setErrors({ 
        submit: 'Something went wrong. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
          <MailIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-anthracite">
            Check your email
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            We sent a magic link to<br />
            <strong>{email}</strong>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEmailSent(false)}
        >
          Didn't receive it? Try again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <SocialLoginButtons />
      
      <Divider text="or" />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          hint="We'll send you a magic link to sign in"
          placeholder="you@example.com"
        />
        
        {errors.submit && (
          <p className="text-sm text-error">{errors.submit}</p>
        )}
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Send Magic Link
        </Button>
      </form>
      
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/login/password')}
        >
          Sign in with password instead
        </Button>
      </div>
    </div>
  );
};
```

---

### 6.3 Form Validation Utilities

```typescript
// lib/validations/auth.ts
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  
  if (!email.includes('@')) {
    return 'Email must contain @';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 12) {
    return 'Password must be at least 12 characters';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain an uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain a lowercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain a number';
  }
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) {
    return 'Name is required';
  }
  
  if (name.length < 2) {
    return 'Name must be at least 2 characters';
  }
  
  if (name.length > 50) {
    return 'Name must be less than 50 characters';
  }
  
  return null;
};
```

---

### 6.4 Custom Hooks

```typescript
// lib/hooks/useFormValidation.ts
import { useState, useCallback } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K]) => string | null;
};

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const validateField = useCallback(
    (name: keyof T, value: any): string | null => {
      const validator = validationRules[name];
      return validator ? validator(value) : null;
    },
    [validationRules]
  );
  
  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      
      // Real-time validation if field was touched and has error
      if (touched[name] && errors[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      }
    },
    [errors, touched, validateField]
  );
  
  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      
      const error = validateField(name, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
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
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );
    
    return isValid;
  }, [values, validateField]);
  
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  };
};
```

**Usage:**

```typescript
const SignUpForm = () => {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation(
    { email: '', password: '', name: '' },
    {
      email: validateEmail,
      password: validatePassword,
      name: validateName,
    }
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateAll()) {
      await signUp(values);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={touched.name ? errors.name : undefined}
      />
      {/* ... more fields */}
    </form>
  );
};
```

---

## 7. Accessibility Checklist

### Complete WCAG 2.1 AA Compliance

**Keyboard Navigation:**
- [ ] All interactive elements focusable via Tab key
- [ ] Focus order follows logical sequence
- [ ] Enter key submits forms
- [ ] Escape key closes modals
- [ ] Arrow keys navigate radio/checkbox groups
- [ ] Tab + Shift navigates backwards

**Screen Reader Support:**
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Error messages announced via role="alert"
- [ ] Loading states announced via aria-busy
- [ ] Dynamic content changes announced
- [ ] Skip to main content link present

**Visual Accessibility:**
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text)
- [ ] Focus indicators visible and clear (3px minimum)
- [ ] Color not sole indicator of state
- [ ] Text resizable up to 200% without loss of function
- [ ] Touch targets ≥ 44x44px

**Form Accessibility:**
- [ ] Labels properly associated with inputs
- [ ] Required fields marked with * and aria-required
- [ ] Error messages linked with aria-describedby
- [ ] Autocomplete attributes set correctly
- [ ] Input types appropriate (email, tel, etc.)
- [ ] Validation errors clearly indicated

**ARIA Attributes:**
```typescript
// Comprehensive ARIA example
<form 
  aria-label="Sign in to your account"
  noValidate
>
  <div>
    <label htmlFor="email">
      Email address
      <span aria-label="required">*</span>
    </label>
    <input
      id="email"
      type="email"
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby="email-error email-hint"
      autoComplete="email"
    />
    <p id="email-hint" className="text-sm">
      We'll send you a magic link
    </p>
    {errors.email && (
      <p id="email-error" role="alert">
        {errors.email}
      </p>
    )}
  </div>
  
  <button
    type="submit"
    aria-busy={loading}
    disabled={loading}
  >
    {loading ? 'Sending...' : 'Send Magic Link'}
  </button>
</form>
```

---

## 8. Implementation Roadmap

### Phase 1: Core Authentication (Week 1-2)

**Priority 1: Magic Link Auth**
- [ ] Set up NextAuth with email provider
- [ ] Implement magic link generation and sending
- [ ] Create sign-in page with email form
- [ ] Create email verification page
- [ ] Set up email templates (Resend/SendGrid)
- [ ] Implement rate limiting

**Priority 2: UI Components**
- [ ] Create Input component with validation states
- [ ] Create enhanced Button component with loading states
- [ ] Create auth Card layouts
- [ ] Implement form validation utilities
- [ ] Create Divider component

**Priority 3: Security**
- [ ] Implement CSRF protection
- [ ] Set up rate limiting (Upstash Redis)
- [ ] Configure secure cookies
- [ ] Add brute force protection

---

### Phase 2: Enhanced Features (Week 3-4)

**Priority 1: Password Auth (Optional)**
- [ ] Add password authentication option
- [ ] Implement password reset flow
- [ ] Create password strength meter
- [ ] Add password validation

**Priority 2: User Experience**
- [ ] Implement "Remember me" functionality
- [ ] Add loading states and transitions
- [ ] Create success/error toasts
- [ ] Implement redirect handling
- [ ] Add email resend functionality

**Priority 3: Session Management**
- [ ] Implement multi-device session tracking
- [ ] Create active sessions page
- [ ] Add new device notification emails
- [ ] Implement session revocation

---

### Phase 3: OAuth & Social Login (Week 5-6)

**Priority 1: OAuth Providers**
- [ ] Set up Google OAuth
- [ ] Set up Microsoft OAuth
- [ ] Create social login button components
- [ ] Implement account linking

**Priority 2: Advanced Security**
- [ ] Add two-factor authentication (2FA)
- [ ] Implement backup codes
- [ ] Create security settings page
- [ ] Add login history/audit log

---

### Phase 4: Polish & Optimization (Week 7-8)

**Priority 1: Performance**
- [ ] Optimize API routes
- [ ] Add caching where appropriate
- [ ] Implement optimistic UI updates
- [ ] Reduce bundle size

**Priority 2: Testing**
- [ ] Write unit tests for validation
- [ ] Write integration tests for auth flows
- [ ] Conduct accessibility audit
- [ ] Perform security penetration testing

**Priority 3: Documentation**
- [ ] Document auth flow for developers
- [ ] Create user-facing help docs
- [ ] Write API documentation
- [ ] Create troubleshooting guide

---

## Quick Start Implementation

### Minimal Viable Auth (Start Here)

**1. Install Dependencies:**
```bash
npm install next-auth @auth/prisma-adapter
npm install @upstash/redis @upstash/ratelimit
npm install resend # for emails
```

**2. Set Up Environment Variables:**
```env
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Email (Resend)
RESEND_API_KEY=your-resend-key

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
```

**3. Create NextAuth Config:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const authOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: 'noreply@hoostn.com',
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-email',
    error: '/error',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**4. Create Sign-In Page:**
```typescript
// app/(auth)/login/page.tsx
import { SignInForm } from '@/components/auth/SignInForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-light">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}
```

**5. Deploy and Test:**
- Test magic link flow end-to-end
- Verify email delivery
- Test error handling
- Verify security measures

---

## Resources

### Documentation
- [NextAuth.js](https://next-auth.js.org/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev: Sign-in form best practices](https://web.dev/sign-in-form-best-practices/)

### Tools
- [Resend](https://resend.com/) - Email sending
- [Upstash](https://upstash.com/) - Redis for rate limiting
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing

---

## Support

For questions or issues with authentication implementation:
- **Technical Lead:** David Bechtel
- **Design Lead:** Tommy Lambert
- **Documentation:** `/docs/development/`

---

**Last Updated:** November 2025  
**Next Review:** December 2025
