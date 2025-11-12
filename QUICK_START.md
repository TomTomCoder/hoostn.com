# ⚡ Quick Start Guide - Build Hoostn with Claude Code

**Goal:** Get started building Hoostn in < 30 minutes
**Last Updated:** November 12, 2025

---

## 🚀 Setup (First Time Only)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your keys:
- Supabase URL and keys (from Supabase dashboard)
- Stripe keys (from Stripe dashboard)
- Optional: Email, SMS, AI keys (can add later)

### 3. Start Supabase
```bash
npm run supabase:start
```

Wait for Supabase to start (~2 minutes). You'll see:
```
Supabase is running at http://localhost:54321
Studio URL: http://localhost:54323
```

### 4. Apply Database Migrations
```bash
npm run db:push
```

This creates all tables, RLS policies, and indexes.

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Day 1: Build Authentication (Today!)

**Time Estimate:** 4-6 hours
**What You'll Build:** Complete sign up and login flow

### Task 1: Configure Supabase Auth (30 min)

**File:** `supabase/config.toml`

Update auth section:
```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
enable_confirmations = false  # Disable for local dev
```

Restart Supabase:
```bash
npm run supabase:stop
npm run supabase:start
```

---

### Task 2: Create Sign Up Page (1.5 hours)

**File:** `apps/web/app/(auth)/signup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            org_name: orgName,
          },
        },
      });

      if (error) throw error;

      setMessage('Check your email for the login link!');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">
            Create your Hoostn account
          </h1>
          <p className="mt-2 text-gray-600">
            Start managing your properties today
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
              placeholder="My Property Management Co."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
              placeholder="your@email.com"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            variant="primary"
          >
            {loading ? 'Sending magic link...' : 'Sign Up'}
          </Button>

          {message && (
            <p className={`text-center text-sm ${
              message.includes('email') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
```

**Create layout:** `apps/web/app/(auth)/layout.tsx`

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Test it:**
1. Go to http://localhost:3000/signup
2. Enter org name and email
3. Check Inbucket (http://localhost:54324) for magic link
4. Click the link

---

### Task 3: Create Auth Callback (30 min)

**File:** `apps/web/app/(auth)/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);

    // Get user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Create organization
        const orgName = user.user_metadata.org_name || 'My Organization';
        const { data: org } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            slug: orgName.toLowerCase().replace(/\s+/g, '-'),
          })
          .select()
          .single();

        // Create user record
        await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            org_id: org?.id,
            role: 'owner',
          });
      }
    }
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

### Task 4: Create Dashboard Layout (1 hour)

**File:** `apps/web/app/(dashboard)/layout.tsx`

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Hoostn</h1>
        </div>
        <nav className="space-y-2 px-4">
          <a
            href="/dashboard"
            className="block rounded-lg px-4 py-2 hover:bg-gray-800"
          >
            Dashboard
          </a>
          <a
            href="/dashboard/properties"
            className="block rounded-lg px-4 py-2 hover:bg-gray-800"
          >
            Properties
          </a>
          <a
            href="/dashboard/reservations"
            className="block rounded-lg px-4 py-2 hover:bg-gray-800"
          >
            Reservations
          </a>
          <a
            href="/dashboard/calendar"
            className="block rounded-lg px-4 py-2 hover:bg-gray-800"
          >
            Calendar
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Nav */}
        <header className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Welcome back!</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/api/auth/logout" method="post">
                <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

**File:** `apps/web/app/(dashboard)/page.tsx`

```typescript
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-600">
        Welcome to Hoostn! Start by adding your first property.
      </p>
    </div>
  );
}
```

---

### Task 5: Create Login Page (30 min)

**File:** `apps/web/app/(auth)/login/page.tsx`

```typescript
// Similar to signup but simpler - just email field
// Copy signup page and remove org_name field
```

---

### Task 6: Create Logout API (15 min)

**File:** `apps/web/app/api/auth/logout/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url));
}
```

---

## ✅ Day 1 Complete Checklist

- [ ] Supabase running locally
- [ ] Database migrated
- [ ] Sign up page created
- [ ] Login page created
- [ ] Auth callback working
- [ ] Dashboard layout created
- [ ] Can sign up → receive email → click link → see dashboard
- [ ] Can logout

**Congratulations!** 🎉 You have a working authentication system!

---

## 🎯 Day 2: Add Your First Property

**See:** `DEVELOPMENT_PHASES.md` → Sprint 2 → Task 2.1-2.5

---

## 🎯 Week 1 Goal

By end of Week 1, you should have:
- ✅ Authentication working
- ✅ Dashboard with sidebar navigation
- ✅ Properties list page
- ✅ Add property form
- ✅ Edit property form
- ✅ Delete property functionality

---

## 📚 Resources

- **Full Build Plan:** See `BUILD_PLAN.md`
- **Detailed Tasks:** See `DEVELOPMENT_PHASES.md`
- **Development Guide:** See `docs/DEVELOPMENT.md`
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 🆘 Troubleshooting

### Supabase won't start
```bash
# Reset Supabase
npm run supabase:stop
rm -rf .supabase
npm run supabase:start
npm run db:push
```

### Database errors
```bash
# Reset database
npm run db:reset
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

**Ready to build?** Start with Task 1 above! 🚀
