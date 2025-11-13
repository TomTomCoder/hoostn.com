# 🔐 Secrets Setup Guide

Complete guide for configuring secrets across GitHub, Vercel, and Supabase for hoostn.com production deployment.

---

## 📋 Quick Start

### Option 1: Automated Setup (Recommended)

Run the master setup script that guides you through all platforms:

```bash
./setup-all-secrets.sh
```

**Time:** 45-60 minutes
**What it does:** Walks through Supabase → Vercel → GitHub configuration interactively

---

### Option 2: Individual Platform Setup

Configure each platform separately:

```bash
# 1. Supabase (do this first)
./setup-supabase-secrets.sh

# 2. Vercel (needs Supabase keys)
./setup-vercel-secrets.sh

# 3. GitHub (needs Vercel project ID)
./setup-github-secrets.sh
```

---

## 🗺️ Setup Order (Important!)

```
1. Supabase
   ↓ (provides API keys)
2. Vercel
   ↓ (provides project IDs)
3. GitHub
   ↓
4. Deploy!
```

**Why this order?**
- Vercel needs Supabase API keys
- GitHub needs Vercel project IDs
- Each platform builds on the previous one

---

## 🗄️ Platform 1: Supabase

### What You'll Create
- Production database project
- Authentication providers
- Storage buckets
- Database extensions

### Run Setup

```bash
./setup-supabase-secrets.sh
```

### Manual Steps

#### Step 1: Create Production Project

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** `hoostn-production`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to users
     - Europe: `eu-west-1` (Ireland)
     - US East: `us-east-1` (Virginia)
     - US West: `us-west-1` (California)
     - Asia: `ap-southeast-1` (Singapore)
4. Click **"Create New Project"**
5. Wait ~2 minutes for setup

#### Step 2: Configure Authentication

Go to: **Authentication → Providers**

**Enable these:**
- ✅ Email (enabled by default)
- ✅ Magic Link (recommended)
- ⚪ Google OAuth (optional, good for international)
- ⚪ GitHub OAuth (optional, good for developers)

**Magic Link Setup:**
1. Authentication → Providers → Email
2. Toggle **"Enable Email Magic Link"**
3. Save

**OAuth Setup (optional):**
1. Click provider (e.g., Google)
2. Toggle **"Enable"**
3. Add Client ID and Secret from provider
4. Save

#### Step 3: Create Storage Buckets

Go to: **Storage → New Bucket**

Create these 4 buckets:

| Bucket Name | Public | Size Limit | MIME Types |
|------------|--------|------------|------------|
| `property-images` | ✅ Yes | 5 MB | image/jpeg, image/png, image/webp |
| `lot-images` | ✅ Yes | 5 MB | image/jpeg, image/png, image/webp |
| `user-avatars` | ✅ Yes | 2 MB | image/jpeg, image/png, image/webp |
| `documents` | ❌ No | 10 MB | application/pdf, image/* |

**For each bucket:**
1. Click **"New Bucket"**
2. Enter name
3. Set "Public bucket" (yes/no)
4. Click **"Create Bucket"**
5. Set up RLS policies (see below)

**Storage Policies (RLS):**

```sql
-- property-images: Anyone can read, authenticated users can upload
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
```

#### Step 4: Enable Database Extensions

Go to: **Database → Extensions**

Enable these:
1. ✅ **postgis** - Geospatial queries
2. ✅ **pg_stat_statements** - Performance monitoring
3. ✅ **uuid-ossp** - UUID generation

**Alternative (SQL Editor):**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Step 5: Configure Security Settings

Go to: **Settings → API**

**Site URL:**
- Production URL: `https://hoostn.com`
- Redirect URLs: `https://hoostn.com/**`

**JWT Settings:**
- JWT expiry: `3600` (1 hour)
- ⚠️ Don't change JWT Secret!

**Rate Limiting:**
- Enable rate limiting
- Email sending rate: `4 per hour`

#### Step 6: Get API Keys

Go to: **Settings → API**

Copy these 3 values (you'll need them for Vercel):

| Variable | From | Format |
|----------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

⚠️ **Keep `service_role` key SECRET!** Server-side only.

---

## 🚀 Platform 2: Vercel

### What You'll Add
- 30+ environment variables
- Production secrets
- Application configuration

### Run Setup

```bash
./setup-vercel-secrets.sh
```

### Interactive Mode (Recommended)

Choose **Option A** for guided setup with instructions for each variable.

### Bulk Import Mode

1. Edit `.env.production`:
   ```bash
   nano .env.production
   ```

2. Fill in all values (replace placeholders)

3. Run bulk import:
   ```bash
   ./setup-vercel-env.sh
   ```

### Environment Variables Reference

#### Category 1: Supabase (from Platform 1)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

#### Category 2: Stripe (Live Mode)

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET - Add after deployment
```

**Where to get:**
1. Go to: https://dashboard.stripe.com
2. Toggle to **"Live Mode"** (top right)
3. Go to: Developers → API Keys
4. Copy Publishable and Secret keys

#### Category 3: Email (Resend)

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@hoostn.com
```

**Where to get:**
1. Go to: https://resend.com
2. Sign up / Log in
3. API Keys → Create API Key
4. Name: "Hoostn Production"
5. Copy key

#### Category 4: AI Services

```bash
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1-...
```

**Gemini:**
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy key

**OpenRouter:**
1. Go to: https://openrouter.ai/keys
2. Sign in
3. Create Key
4. Copy key

#### Category 5: Application URLs

```bash
NEXT_PUBLIC_APP_URL=https://hoostn.com
NEXT_PUBLIC_API_URL=https://hoostn.com/api
NEXT_PUBLIC_SITE_URL=https://hoostn.com
```

#### Category 6: Security

```bash
# Generate with: openssl rand -base64 32
CRON_SECRET=<generated-secret>
NODE_ENV=production
```

#### Category 7: Optional Services

```bash
# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...

# Booking.com (OTA)
BOOKING_API_KEY=...
BOOKING_API_SECRET=...
```

### Verify Environment Variables

```bash
# List all production variables
vercel env ls production

# Pull locally for testing
vercel env pull .env.local
```

---

## 🐙 Platform 3: GitHub

### What You'll Add
- CI/CD secrets
- Deployment automation
- Workflow configuration

### Run Setup

```bash
./setup-github-secrets.sh
```

### Required Secrets

#### 1. VERCEL_TOKEN

**What it's for:** Automated deployments from GitHub Actions

**How to get:**
1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `GitHub Actions - Hoostn`
4. Scope: **Full Account**
5. Click **"Create"**
6. Copy token (starts with `vercel_...`)

**Add to GitHub:**
```bash
echo 'your-vercel-token' | gh secret set VERCEL_TOKEN
```

#### 2. VERCEL_ORG_ID

**What it's for:** Identify your Vercel organization

**How to get:**
```bash
# Method 1: From .vercel directory (after linking)
cat .vercel/project.json | grep orgId

# Method 2: From Vercel Dashboard
# Settings → General → Team ID / Org ID
```

**Add to GitHub:**
```bash
echo 'your-org-id' | gh secret set VERCEL_ORG_ID
```

#### 3. VERCEL_PROJECT_ID

**What it's for:** Identify your Vercel project

**How to get:**
```bash
# Method 1: From .vercel directory
cat .vercel/project.json | grep projectId

# Method 2: From Vercel Dashboard
# Settings → General → Project ID
```

**Add to GitHub:**
```bash
echo 'your-project-id' | gh secret set VERCEL_PROJECT_ID
```

#### 4. SUPABASE_ACCESS_TOKEN

**What it's for:** Run database operations in CI/CD

**How to get:**
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Name: `GitHub Actions - Hoostn`
4. Click **"Generate Token"**
5. Copy token

**Note:** This is different from your API keys!

**Add to GitHub:**
```bash
echo 'your-supabase-token' | gh secret set SUPABASE_ACCESS_TOKEN
```

#### 5. SUPABASE_PROJECT_REF

**What it's for:** Identify your Supabase project in CI/CD

**How to get:**
1. Go to: https://supabase.com/dashboard
2. Select your **PRODUCTION** project
3. Settings → General
4. Copy **Reference ID** (e.g., `abcdefghijklmnop`)

**Add to GitHub:**
```bash
echo 'your-project-ref' | gh secret set SUPABASE_PROJECT_REF
```

### Verify GitHub Secrets

```bash
# List all secrets
gh secret list

# Test in workflow
git push  # Triggers CI/CD
```

---

## ✅ Verification Checklist

### Supabase
- [ ] Production project created
- [ ] Authentication providers configured
- [ ] Storage buckets created (4 buckets)
- [ ] Database extensions enabled (postgis, pg_stat_statements)
- [ ] Security settings configured
- [ ] API keys copied

### Vercel
- [ ] Project linked (`vercel link`)
- [ ] All environment variables added (30+ vars)
- [ ] Variables verified (`vercel env ls production`)
- [ ] Supabase keys added
- [ ] Stripe keys added (live mode)
- [ ] AI keys added
- [ ] Application URLs configured

### GitHub
- [ ] GitHub CLI installed (`gh --version`)
- [ ] Authenticated (`gh auth status`)
- [ ] All 5 secrets added
- [ ] Secrets verified (`gh secret list`)
- [ ] Workflows present (`.github/workflows/`)

---

## 🔒 Security Best Practices

### 1. Secret Management
- ✅ **Never commit secrets to git**
- ✅ **Use environment variables for all secrets**
- ✅ **Rotate secrets periodically (every 90 days)**
- ✅ **Use different secrets for dev/staging/production**

### 2. Access Control
- ✅ **Limit who has access to production secrets**
- ✅ **Use separate Stripe accounts for test/live**
- ✅ **Enable 2FA on all platforms**
- ✅ **Review access logs regularly**

### 3. Supabase Security
- ✅ **Enable RLS on all tables**
- ✅ **Use `service_role` key only server-side**
- ✅ **Configure storage policies**
- ✅ **Enable rate limiting**
- ✅ **Use SSL for database connections**

### 4. Vercel Security
- ✅ **Set `NODE_ENV=production`**
- ✅ **Use environment variable encryption**
- ✅ **Enable deployment protection**
- ✅ **Configure security headers**
- ✅ **Set up monitoring (Sentry)**

### 5. GitHub Security
- ✅ **Use GitHub Secrets (not environment variables)**
- ✅ **Limit workflow permissions**
- ✅ **Review Actions logs**
- ✅ **Enable branch protection**
- ✅ **Require code review**

---

## 🚨 Troubleshooting

### Issue: "Vercel CLI not found"

**Solution:**
```bash
npm install -g vercel
vercel --version
```

### Issue: "GitHub CLI not found"

**Solution:**
```bash
# macOS
brew install gh

# Linux
# See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Verify
gh --version
```

### Issue: "Project not linked to Vercel"

**Solution:**
```bash
vercel link
# Follow prompts to select team and project
```

### Issue: "Cannot add secret to GitHub"

**Solution:**
```bash
# Login to GitHub
gh auth login

# Check repository access
gh auth status

# Verify repository
gh repo view
```

### Issue: "Environment variable not working in production"

**Checklist:**
1. Verify it's added: `vercel env ls production`
2. Check variable name (case-sensitive)
3. Redeploy after adding: `vercel --prod`
4. Check deployment logs: `vercel logs`

### Issue: "Supabase connection fails"

**Checklist:**
1. Verify API keys are correct
2. Check if IP is allowed (Supabase doesn't restrict by default)
3. Verify SSL connection
4. Check rate limiting
5. Review RLS policies

---

## 📊 Secrets Summary

### Total Secrets Required

| Platform | Required | Optional | Total |
|----------|----------|----------|-------|
| Supabase | 3 keys | - | 3 |
| Vercel | 13 vars | 6 vars | 19+ |
| GitHub | 5 secrets | - | 5 |
| **TOTAL** | **21** | **6** | **27** |

### Time Investment

| Platform | Setup Time | Difficulty |
|----------|-----------|------------|
| Supabase | 15-20 min | ⭐⭐ Easy |
| Vercel | 20-30 min | ⭐⭐⭐ Medium |
| GitHub | 5-10 min | ⭐ Very Easy |
| **TOTAL** | **45-60 min** | - |

---

## 📝 Next Steps After Secrets Setup

1. **Apply Database Migrations**
   ```bash
   ./setup-production-db.sh
   ```

2. **Deploy to Production**
   ```bash
   ./deploy-to-vercel.sh
   ```

3. **Configure Stripe Webhook**
   - URL: `https://hoostn.com/api/stripe/webhook`
   - Add `STRIPE_WEBHOOK_SECRET` to Vercel
   - Redeploy

4. **Verify Deployment**
   ```bash
   ./verify-production.sh https://hoostn.com
   ```

5. **Set Up Monitoring**
   - Sentry: https://sentry.io
   - UptimeRobot: https://uptimerobot.com
   - Vercel Analytics (enabled by default)

---

## 🔗 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs/concepts/projects/environment-variables
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Stripe Live Mode:** https://stripe.com/docs/keys#obtain-api-keys

---

## 💡 Pro Tips

1. **Save Secrets Securely**
   - Use password manager (1Password, LastPass, Bitwarden)
   - Create secure note with all keys
   - Share with team securely

2. **Document Your Setup**
   - Keep track of which accounts you created
   - Note down region choices
   - Save project references

3. **Test Before Production**
   - Pull secrets locally: `vercel env pull .env.local`
   - Test locally: `npm run dev`
   - Verify all features work

4. **Automate Secret Rotation**
   - Set calendar reminders (90 days)
   - Use secret rotation scripts
   - Test after rotation

5. **Monitor Secret Usage**
   - Check Vercel deployment logs
   - Review Supabase activity
   - Monitor GitHub Actions runs

---

**Ready to configure secrets? Run:**

```bash
./setup-all-secrets.sh
```

**Or configure individually:**

```bash
./setup-supabase-secrets.sh  # Step 1
./setup-vercel-secrets.sh    # Step 2
./setup-github-secrets.sh    # Step 3
```

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Platforms:** Supabase, Vercel, GitHub
