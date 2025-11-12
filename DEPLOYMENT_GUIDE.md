# 🚀 Hoostn Authentication System - Deployment Guide

**Version:** 1.0
**Date:** November 12, 2025
**Status:** ✅ Ready for Deployment

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Migration](#database-migration)
5. [Email Configuration](#email-configuration)
6. [Testing Guide](#testing-guide)
7. [Deployment Checklist](#deployment-checklist)
8. [Troubleshooting](#troubleshooting)
9. [Security Verification](#security-verification)

---

## 🎯 Overview

This guide covers the deployment of Hoostn's complete authentication system, which includes:

- **Magic Link Authentication** with PKCE flow
- **Multi-tenant Organization Management** (auto-created on signup)
- **Row Level Security (RLS)** with optimized JWT-based helpers
- **Protected Routes** with middleware authentication
- **Dashboard UI** with sidebar navigation and user management

### What Was Built

**Database Layer (4 Migrations):**
- `20250112000002_auth_triggers.sql` - Auto org/user creation triggers
- `20250112000003_rls_helpers.sql` - 10 optimized RLS helper functions
- `20250112000004_enhanced_rls.sql` - 34 comprehensive RLS policies
- `20250112000005_performance_indexes.sql` - 53 performance indexes

**Backend (Routes & Actions):**
- `app/auth/callback/route.ts` - PKCE code exchange handler
- `lib/actions/auth.ts` - Server actions (sign in/up/out)
- `app/api/auth/signout/route.ts` - Signout API
- `middleware.ts` - Route protection logic

**Frontend (Auth Pages):**
- `app/(auth)/login/page.tsx` - Login with magic link
- `app/(auth)/signup/page.tsx` - Signup with org creation
- `app/(auth)/verify/page.tsx` - Email verification success
- `app/(auth)/auth-error/page.tsx` - Error display

**Dashboard (Protected Area):**
- `app/dashboard/layout.tsx` - Protected layout with auth guard
- `components/dashboard/sidebar.tsx` - Navigation sidebar
- `components/dashboard/navbar.tsx` - Top navbar with user menu
- `app/dashboard/page.tsx` - Dashboard home
- `app/dashboard/profile/page.tsx` - User profile

---

## ✅ Prerequisites

### Required

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Supabase CLI**: >= 1.190.0
- **Docker Desktop**: For local Supabase instance

### Optional

- **Git**: For version control
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript

---

## 🔧 Environment Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js 14.2.0 (App Router)
- React 18.3.0
- Supabase SSR packages
- TypeScript, Tailwind, Zod, etc.

### Step 2: Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: For production
# NEXT_PUBLIC_SITE_URL=https://hoostn.com
```

**For Local Development:**

```bash
# Start local Supabase
npm run supabase:start
```

Wait for Supabase to start (~2 minutes). Copy the credentials from the output:

```
API URL: http://localhost:54321
Anon key: eyJhbGc...
Service role key: eyJhbGc...
Studio URL: http://localhost:54323
```

Update `.env.local` with these local credentials.

---

## 🗄️ Database Migration

### Step 1: Verify Migration Files

Ensure all migration files exist in `supabase/migrations/`:

```bash
ls -la supabase/migrations/
```

You should see:
- `20250112000001_initial_schema.sql` (209 lines)
- `20250112000002_auth_triggers.sql` (209 lines)
- `20250112000003_rls_helpers.sql` (284 lines)
- `20250112000004_enhanced_rls.sql` (551 lines)
- `20250112000005_performance_indexes.sql` (333 lines)

**Total: 1,586 lines of production-ready SQL**

### Step 2: Apply Migrations

**For Local Development:**

```bash
npm run db:push
```

This applies all migrations to your local Supabase instance.

**For Production (Supabase Cloud):**

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Step 3: Verify Migrations

Connect to your database and verify:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show: organizations, users, properties, lots, reservations, etc.

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true

-- Check if trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created';

-- Check helper functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_%';
```

---

## 📧 Email Configuration

### Step 1: Configure Auth Email Templates

Go to Supabase Dashboard → Authentication → Email Templates

Update the **Magic Link** template:

**Subject:**
```
Sign in to Hoostn
```

**Body:**
```html
<h2>Welcome to Hoostn!</h2>
<p>Click the link below to sign in to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to Hoostn</a></p>
<p>This link will expire in 15 minutes.</p>
<p>If you didn't request this email, you can safely ignore it.</p>
```

**Important:** Make sure the redirect URL is set correctly:

```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://hoostn.com/auth/callback (for production)
```

### Step 2: Email Provider (Production Only)

For production, configure a custom SMTP provider:

**Supabase Dashboard → Project Settings → Auth → SMTP Settings**

Recommended providers:
- **Resend** (recommended for transactional emails)
- **SendGrid**
- **Amazon SES**

Example configuration with Resend:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: your_resend_api_key
Sender Email: noreply@hoostn.com
Sender Name: Hoostn
```

### Step 3: Test Email Delivery (Local Dev)

For local development, Supabase includes **Inbucket** for testing emails:

```
Inbucket URL: http://localhost:54324
```

1. Go to http://localhost:54324
2. Click on any email address (all emails are captured)
3. View the magic link email

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Test 1: Sign Up Flow

1. **Navigate to signup**
   ```
   http://localhost:3000/signup
   ```

2. **Fill out the form:**
   - Full Name: "John Doe"
   - Organization Name: "Acme Properties"
   - Email: "john@example.com"

3. **Submit and verify:**
   - ✅ Success message appears
   - ✅ Email sent (check Inbucket at http://localhost:54324)
   - ✅ Click magic link in email
   - ✅ Redirected to /dashboard
   - ✅ User sees dashboard with "Welcome, John"

4. **Verify database:**
   ```sql
   -- Check organization created
   SELECT * FROM organizations WHERE name = 'Acme Properties';

   -- Check user created
   SELECT * FROM users WHERE email = 'john@example.com';

   -- Check org_id in app_metadata
   SELECT raw_app_meta_data FROM auth.users WHERE email = 'john@example.com';
   ```

#### Test 2: Sign In Flow (Existing User)

1. **Sign out first:**
   - Click user menu → Logout

2. **Navigate to login:**
   ```
   http://localhost:3000/login
   ```

3. **Enter existing email:**
   - Email: "john@example.com"

4. **Verify:**
   - ✅ Success message appears
   - ✅ Email sent with magic link
   - ✅ Click link → redirected to dashboard
   - ✅ User data persisted (same org, same name)

#### Test 3: Protected Routes

1. **While logged out, try accessing:**
   ```
   http://localhost:3000/dashboard
   http://localhost:3000/dashboard/properties
   ```

2. **Verify:**
   - ✅ Redirected to /login
   - ✅ URL includes redirect param: `/login?redirect=/dashboard`

3. **While logged in, try accessing:**
   ```
   http://localhost:3000/login
   http://localhost:3000/signup
   ```

4. **Verify:**
   - ✅ Redirected to /dashboard

#### Test 4: Multi-Tenant Isolation

1. **Create two users in different orgs:**
   - User A: alice@example.com → "Alice Properties"
   - User B: bob@example.com → "Bob Rentals"

2. **Log in as User A and create a property:**
   ```sql
   INSERT INTO properties (name, org_id)
   VALUES ('Alice Property', (SELECT org_id FROM users WHERE email = 'alice@example.com'));
   ```

3. **Log in as User B and query:**
   ```sql
   SELECT * FROM properties;
   ```

4. **Verify:**
   - ✅ User B sees ONLY their own properties (empty)
   - ✅ User B cannot see User A's properties (RLS working)

#### Test 5: Error Handling

1. **Test invalid email:**
   - Enter "notanemail" → should show validation error

2. **Test signup with existing email:**
   - Sign up with same email twice → should show "account already exists"

3. **Test expired magic link:**
   - Wait 15+ minutes and click link → should show error page

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.local` or production env)
- [ ] Database migrations applied (`npm run db:push`)
- [ ] Email templates configured in Supabase
- [ ] SMTP provider configured (production only)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] ESLint warnings resolved (`npm run lint`)
- [ ] Build successful (`npm run build`)

### Security Verification

- [ ] RLS enabled on all tables
- [ ] RLS policies tested (users can't access other orgs' data)
- [ ] Middleware protecting all dashboard routes
- [ ] Auth pages redirect when already logged in
- [ ] Session refresh working in middleware
- [ ] JWT contains correct `org_id` in `app_metadata`
- [ ] SQL injection prevention (all queries parameterized)
- [ ] XSS prevention (React escapes all user input)

### Performance Verification

- [ ] RLS helper functions using JWT (not database lookups)
- [ ] Indexes created on all `org_id` columns
- [ ] Page load time < 3 seconds
- [ ] No N+1 queries in dashboard

### Production Deployment (Vercel)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: Complete authentication system"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Connect GitHub repo to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Post-Deployment Verification:**
   - [ ] Signup flow works on production URL
   - [ ] Login flow works on production URL
   - [ ] Magic links work (emails sent via SMTP)
   - [ ] Protected routes require authentication
   - [ ] RLS policies active
   - [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: "Invalid authentication callback. Missing required parameters."

**Cause:** Redirect URL not configured correctly in Supabase

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URL: `http://localhost:3000/auth/callback`
3. For production, add: `https://yourdomain.com/auth/callback`

---

### Issue: Magic link doesn't redirect to dashboard

**Cause:** `NEXT_PUBLIC_SITE_URL` not set correctly

**Fix:**
```env
# In .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# In production
NEXT_PUBLIC_SITE_URL=https://hoostn.com
```

Restart your dev server after changing.

---

### Issue: "User not found" when signing in

**Cause:** User trying to log in hasn't signed up yet

**Fix:**
- Make sure user signs up first (signup creates the user)
- Or check if email is correct

---

### Issue: RLS policies blocking all queries

**Cause:** `org_id` not set in `app_metadata`

**Fix:** Run migration script to backfill existing users:
```sql
DO $$
DECLARE
  user_record RECORD;
  user_org_id UUID;
BEGIN
  FOR user_record IN
    SELECT id, email, raw_app_meta_data
    FROM auth.users
    WHERE raw_app_meta_data->>'org_id' IS NULL
  LOOP
    SELECT org_id INTO user_org_id
    FROM public.users
    WHERE id = user_record.id;

    IF user_org_id IS NOT NULL THEN
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
        jsonb_build_object('org_id', user_org_id)
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END $$;
```

---

### Issue: Session expires immediately

**Cause:** Cookie settings incompatible with your setup

**Fix:** Check `supabase/config.toml`:
```toml
[auth]
jwt_expiry = 3600  # 1 hour
enable_refresh_token_rotation = true
```

---

### Issue: Can't read properties after login

**Cause:** User profile not created in database

**Fix:** Check if trigger fired:
```sql
SELECT * FROM users WHERE id = 'user_auth_id';
```

If empty, trigger didn't fire. Manually create:
```sql
INSERT INTO users (id, email, org_id, role)
VALUES ('user_id', 'email@example.com', 'org_id', 'owner');
```

---

## 🔒 Security Verification

### RLS Policy Test

Run these queries to verify RLS is working:

```sql
-- As User A (alice@example.com)
SET request.jwt.claims = '{"sub": "alice_id", "app_metadata": {"org_id": "alice_org_id"}}';

SELECT * FROM properties;
-- Should only see Alice's properties

-- As User B (bob@example.com)
SET request.jwt.claims = '{"sub": "bob_id", "app_metadata": {"org_id": "bob_org_id"}}';

SELECT * FROM properties;
-- Should only see Bob's properties

-- Try to insert into another org (should fail)
INSERT INTO properties (name, org_id) VALUES ('Hack', 'alice_org_id');
-- Error: new row violates row-level security policy
```

### SQL Injection Test

All queries use parameterized inputs via Supabase SDK:

```typescript
// ✅ Safe - parameterized
await supabase.from('properties').select('*').eq('id', userInput);

// ❌ Never do this - vulnerable to SQL injection
await supabase.raw(`SELECT * FROM properties WHERE id = '${userInput}'`);
```

### XSS Prevention

React automatically escapes all user input:

```typescript
// ✅ Safe - React escapes HTML
<h1>{user.full_name}</h1>

// ❌ Never do this - allows XSS
<h1 dangerouslySetInnerHTML={{ __html: user.full_name }} />
```

---

## 📊 Performance Metrics

### Expected Performance

- **Page Load Time:** < 3 seconds (95th percentile)
- **API Response Time:** < 500ms (95th percentile)
- **Magic Link Email Delivery:** < 5 seconds
- **Database Query Time:** < 50ms (with indexes)
- **RLS Query Performance:** 10-100x faster with JWT helpers

### Monitoring

Add monitoring in production:

```typescript
// Example: Add to pages
import { performance } from 'perf_hooks';

const start = performance.now();
// ... page load ...
const duration = performance.now() - start;
console.log(`Page load: ${duration}ms`);
```

---

## ✅ Ready to Deploy!

Your authentication system is production-ready. Follow this checklist:

1. ✅ Run through manual testing checklist
2. ✅ Verify all environment variables
3. ✅ Apply database migrations
4. ✅ Configure email templates
5. ✅ Test magic link flow end-to-end
6. ✅ Verify RLS policies
7. ✅ Deploy to production
8. ✅ Test on production URL

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [EXPLORATION_FINDINGS.md](./EXPLORATION_FINDINGS.md) for implementation details
3. Consult the [BUILD_PLAN.md](./BUILD_PLAN.md) for architecture overview

---

**Last Updated:** November 12, 2025
**Version:** 1.0
**Status:** ✅ Production Ready
