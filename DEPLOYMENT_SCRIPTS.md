# Hoostn.com - Deployment Scripts

Automated deployment scripts for deploying hoostn.com to Vercel production.

## 📋 Quick Start

### Option 1: Complete Automated Deployment (Recommended)

Run the master orchestrator script that guides through everything:

```bash
./deploy-production.sh
```

This interactive script will:
- ✓ Verify pre-deployment requirements
- ✓ Set up Vercel project
- ✓ Configure environment variables
- ✓ Apply database migrations
- ✓ Deploy application
- ✓ Run verification tests

**Time:** 30-60 minutes
**Prerequisites:** Supabase account, Vercel account, Stripe account

---

### Option 2: Step-by-Step Manual Deployment

Run each script individually for more control:

#### 1. Deploy to Vercel

```bash
./deploy-to-vercel.sh
```

- Logs in to Vercel
- Links repository to project
- Deploys to production
- Provides post-deployment checklist

#### 2. Set Up Environment Variables

```bash
# First, edit .env.production with your values
nano .env.production

# Then run automated setup
./setup-vercel-env.sh
```

- Reads `.env.production` file
- Sets all variables in Vercel
- Skips placeholders automatically

#### 3. Apply Database Migrations

```bash
./setup-production-db.sh
```

- Logs in to Supabase
- Links to production project
- Applies all 7 migrations
- Verifies successful migration

#### 4. Verify Production

```bash
./verify-production.sh https://hoostn.com
```

- Runs 8 smoke tests
- Checks HTTP status codes
- Verifies API endpoints
- Tests security headers

---

## 📁 Script Reference

### `deploy-production.sh` (Master Orchestrator)

**Purpose:** Complete end-to-end production deployment
**Interactive:** Yes
**Duration:** 30-60 minutes

**What it does:**
1. Pre-deployment verification (Git, Node.js, Vercel CLI)
2. Vercel project setup and linking
3. Environment variables configuration
4. Database migration to production
5. Application deployment
6. Production verification tests
7. Deployment summary and next steps

**Usage:**
```bash
./deploy-production.sh
```

**Requirements:**
- Git repository clean (or will help commit)
- Node.js 18+
- Vercel account
- Supabase account
- All API keys ready

---

### `deploy-to-vercel.sh`

**Purpose:** Deploy application to Vercel
**Interactive:** Yes
**Duration:** 5-10 minutes

**What it does:**
1. Verifies git status
2. Logs in to Vercel
3. Links project to Vercel
4. Checks environment variables setup
5. Deploys to production
6. Shows post-deployment checklist

**Usage:**
```bash
./deploy-to-vercel.sh
```

**Notes:**
- Requires environment variables to be set first
- Can be run standalone or as part of master script
- Supports interactive prompts for safety

---

### `setup-vercel-env.sh`

**Purpose:** Automate environment variable configuration
**Interactive:** No (after setup)
**Duration:** 1-2 minutes

**What it does:**
1. Reads `.env.production` file
2. Validates each variable
3. Skips placeholder values
4. Sets all real values in Vercel
5. Provides summary of results

**Usage:**
```bash
# Edit production config
nano .env.production

# Run automated setup
./setup-vercel-env.sh
```

**Configuration:**
Edit `.env.production` and replace all placeholder values:

```bash
# Example placeholders to replace:
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co  # ← Replace
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key                # ← Replace
STRIPE_SECRET_KEY=sk_live_...                                         # ← Replace
CRON_SECRET=GENERATE_RANDOM_SECRET_HERE                               # ← Generate with: openssl rand -base64 32
```

**Notes:**
- Automatically skips placeholder values
- Uses `--force` flag to overwrite existing values
- Validates before setting each variable

---

### `setup-production-db.sh`

**Purpose:** Apply database migrations to production
**Interactive:** Yes
**Duration:** 5-10 minutes

**What it does:**
1. Logs in to Supabase
2. Links to production project (via project ref)
3. Shows pending migrations (7 total)
4. Recommends creating backup
5. Applies all migrations
6. Verifies successful application

**Usage:**
```bash
./setup-production-db.sh
```

**Migrations Applied:**
1. `20250112000017_ota_connections.sql` - OTA connections table
2. `20250112000018_ota_sync_logs.sql` - Sync audit logs
3. `20250112000019_reservations_ota_fields.sql` - Reservation enhancements
4. `20250112000020_ota_conflicts.sql` - Conflict tracking
5. `20250113000001_stripe_connect_schema.sql` - Stripe Connect (7 tables)
6. `20250113000002_stripe_connect_updates.sql` - Additional Stripe fields
7. `20250113000003_chat_enhancements.sql` - AI chat enhancements

**Safety:**
- ⚠️  Prompts for confirmation before modifying production
- Recommends backup before applying
- Verifies migrations after application
- Can be safely re-run (idempotent migrations)

---

### `verify-production.sh`

**Purpose:** Run smoke tests on production
**Interactive:** No
**Duration:** 1-2 minutes

**What it does:**
Runs 8 critical smoke tests:
1. Homepage accessibility (HTTP 200)
2. API health check
3. Login/signup pages
4. Protected routes (redirect to login)
5. API endpoints (proper error codes)
6. Static assets
7. Security headers (CSP, HSTS)
8. SSL certificate (HTTPS)

**Usage:**
```bash
# Test default URL
./verify-production.sh

# Test custom URL
./verify-production.sh https://your-domain.com
```

**Exit Codes:**
- `0` - All tests passed
- `1` - One or more tests failed

**Example Output:**
```
🧪 Hoostn.com - Production Verification
========================================

Testing: https://hoostn.com

Test 1: Homepage Accessibility
Testing Homepage HTTP status... ✓ PASS

Test 2: API Health Check
Testing Health endpoint... ✓ PASS

...

========================================
Test Summary:

✓ Passed: 8
✗ Failed: 0

🎉 All tests passed! Production is healthy.
```

---

## 🔧 Configuration Files

### `.env.production`

Production environment variables template. **Edit this file** with your production credentials before running deployment scripts.

**Required Variables:**

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (live) | Stripe Dashboard → API Keys (Live mode) |
| `STRIPE_SECRET_KEY` | Stripe secret key (live) | Stripe Dashboard → API Keys (Live mode) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Created after webhook setup |
| `RESEND_API_KEY` | Email service key | Resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Sender email | Your verified domain |
| `GEMINI_API_KEY` | Google AI key | Google AI Studio |
| `OPENROUTER_API_KEY` | OpenRouter key | OpenRouter.ai → Keys |
| `CRON_SECRET` | Random secret | Generate: `openssl rand -base64 32` |
| `NODE_ENV` | Environment | `production` |

**Optional Variables:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS (Twilio)
- `BOOKING_API_KEY`, `BOOKING_API_SECRET` - Booking.com integration

---

## 🚨 Common Issues

### Issue: "Project not linked to Vercel"

**Solution:**
```bash
vercel link
```
Follow prompts to select team and project.

---

### Issue: "Supabase CLI not found"

**Solution:**
```bash
npm install -g supabase
# or
npx supabase login
```

---

### Issue: "Network timeout during npm install"

**Solution:**
This is a temporary network issue. Vercel's build servers won't have this problem. Deploy directly:
```bash
vercel --prod
```

---

### Issue: "Environment variable not set"

**Solution:**
```bash
# Set manually
vercel env add VARIABLE_NAME production

# Or edit .env.production and re-run
./setup-vercel-env.sh
```

---

### Issue: "Migration already applied"

**Solution:**
Migrations are idempotent. Re-running is safe:
```bash
npx supabase db push
```

---

## 📝 Deployment Checklist

Use this checklist when deploying:

### Pre-Deployment
- [ ] All code committed and pushed
- [ ] Tests passing locally
- [ ] `.env.production` configured with real values
- [ ] Production Supabase project created
- [ ] Stripe account set up (live mode)
- [ ] Domain purchased and DNS access available

### Deployment
- [ ] Vercel project linked
- [ ] Environment variables configured (30+ vars)
- [ ] Database migrations applied (7 migrations)
- [ ] Application deployed to Vercel
- [ ] Custom domain configured
- [ ] SSL certificate active

### Post-Deployment
- [ ] Smoke tests passing
- [ ] Stripe webhook configured
- [ ] Cron job running (OTA sync)
- [ ] Monitoring set up (Sentry, UptimeRobot)
- [ ] Backup strategy in place
- [ ] Team access granted

---

## 🎯 Deployment Strategies

### Strategy 1: All-in-One (Fastest)

For experienced users who have everything ready:

```bash
# Edit config
nano .env.production

# Run master script
./deploy-production.sh

# Select "yes" for all prompts
# Time: ~30 minutes
```

---

### Strategy 2: Staged Deployment (Safest)

For first-time deployments or production systems:

```bash
# Day 1: Set up infrastructure
./setup-production-db.sh
./setup-vercel-env.sh

# Day 2: Deploy and test
./deploy-to-vercel.sh
./verify-production.sh

# Day 3: Monitor and optimize
# Review logs, set up monitoring, configure webhooks
```

---

### Strategy 3: CI/CD Automation (Advanced)

For continuous deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g vercel
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🔗 Additional Resources

- **Full Deployment Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Project Documentation:** `README.md`
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 💡 Tips

1. **Generate Strong Secrets:**
   ```bash
   openssl rand -base64 32
   ```

2. **Test Locally First:**
   ```bash
   npm run build
   npm run start
   ```

3. **Backup Before Migrations:**
   ```bash
   npx supabase db dump -f backup_$(date +%Y%m%d).sql
   ```

4. **Monitor Deployment:**
   ```bash
   vercel logs --follow
   ```

5. **Quick Rollback:**
   ```bash
   vercel rollback
   ```

---

## 🆘 Support

- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.io
- **Stripe Support:** https://support.stripe.com

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0
**Platform:** Vercel, Supabase, Next.js 14
