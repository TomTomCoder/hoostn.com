# Hoostn.com - Production Deployment Guide

## 🎯 Overview
Complete guide for deploying hoostn.com to Vercel production with full feature enablement.

**Deployment Strategy:** Blue-Green with gradual rollout
**Estimated Time:** 2-3 hours
**Downtime:** Zero (new deployment)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Code Verification
- [x] All tests passing locally
- [x] TypeScript compilation successful
- [x] No ESLint errors
- [x] All features committed and pushed
- [x] Branch: `claude/multi-agent-planning-build-011CV47hpHM5iAnNt7VtbqD1`

### 2. Database Ready
- [ ] Production Supabase project created
- [ ] All 7 migrations ready to apply
- [ ] Database backup strategy in place
- [ ] RLS policies tested

### 3. Third-Party Services
- [ ] Stripe account created (production)
- [ ] Resend account configured
- [ ] Gemini API key obtained
- [ ] OpenRouter API key obtained
- [ ] Mapbox token ready

### 4. Domain & DNS
- [ ] Domain purchased: hoostn.com
- [ ] DNS access available
- [ ] SSL certificate plan (Vercel auto-handles)

---

## 📦 STEP 1: CREATE PRODUCTION SUPABASE PROJECT

### 1.1 Create Project
```bash
# Go to https://supabase.com/dashboard
# Click "New Project"
# Settings:
- Name: hoostn-production
- Database Password: [GENERATE STRONG PASSWORD - SAVE IT]
- Region: Europe West (cdg1) - Paris
- Plan: Pro ($25/month recommended)
```

### 1.2 Save Credentials
From Supabase Dashboard → Settings → API:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### 1.3 Enable Required Extensions
```sql
-- In Supabase SQL Editor, run:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### 1.4 Configure Storage
- Go to Storage → Policies
- Buckets will be created by migrations
- Verify public access for property-images and lot-images

---

## 📊 STEP 2: APPLY DATABASE MIGRATIONS

### 2.1 Link to Production Project
```bash
cd /home/user/hoostn.com

# Login to Supabase
npx supabase login

# Link to production project
npx supabase link --project-ref [your-project-id]
```

### 2.2 Review Migrations
```bash
# List all pending migrations
npx supabase db diff

# Migrations to apply (in order):
# 1. 20250112000017_ota_connections.sql
# 2. 20250112000018_ota_sync_logs.sql
# 3. 20250112000019_reservations_ota_fields.sql
# 4. 20250112000020_ota_conflicts.sql
# 5. 20250113000001_stripe_connect_schema.sql
# 6. 20250113000002_stripe_connect_updates.sql
# 7. 20250113000003_chat_enhancements.sql
```

### 2.3 Apply Migrations
```bash
# Push migrations to production
npx supabase db push

# Verify successful
npx supabase db diff  # Should show "No changes"
```

### 2.4 Seed Default Data
```sql
-- In Supabase SQL Editor, run:
-- Insert default amenities (40 items)
-- See: /supabase/seed/production-seed.sql
```

---

## 🔧 STEP 3: CONFIGURE STRIPE

### 3.1 Create Stripe Account
```bash
# Go to https://dashboard.stripe.com/register
# Complete business verification
# Enable live mode
```

### 3.2 Enable Stripe Connect
```bash
# Dashboard → Connect → Get Started
# Account type: Platform
# Settings:
  - Express accounts: Enabled
  - Country: France (or your country)
  - Currency: EUR
```

### 3.3 Get API Keys
```bash
# Dashboard → Developers → API Keys
# Live mode keys:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
STRIPE_SECRET_KEY=sk_live_[your-key]
```

### 3.4 Configure Webhooks (WAIT until after Vercel deployment)
```bash
# Endpoint: https://hoostn.com/api/stripe/webhook
# Events to subscribe:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
  - account.updated
  - charge.succeeded
```

---

## 🚀 STEP 4: DEPLOY TO VERCEL

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 4.2 Link Project (if not linked)
```bash
cd /home/user/hoostn.com
vercel link
# Follow prompts to create/link project
```

### 4.3 Configure Project Settings
```bash
# Framework: Next.js (auto-detected)
# Root Directory: ./
# Build Command: npm run build
# Output Directory: .next
# Install Command: npm install
# Development Command: npm run dev
```

### 4.4 Set Production Environment Variables
```bash
# Method 1: Via Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value, repeat for all variables

# Method 2: Via Vercel Dashboard (RECOMMENDED)
# Go to: vercel.com/[your-team]/hoostn/settings/environment-variables
```

**Required Environment Variables:**
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Stripe (REQUIRED)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=[will get after webhook setup]

# Email (REQUIRED)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@hoostn.com

# AI Services (REQUIRED)
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1-...

# Application (REQUIRED)
NEXT_PUBLIC_APP_URL=https://hoostn.com
NEXT_PUBLIC_API_URL=https://hoostn.com/api
NEXT_PUBLIC_SITE_URL=https://hoostn.com

# Cron Security (REQUIRED)
CRON_SECRET=[generate: openssl rand -base64 32]

# Optional Services
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...
BOOKING_API_KEY=...
BOOKING_API_SECRET=...

# Environment
NODE_ENV=production
```

### 4.5 Deploy to Production
```bash
# Deploy from your feature branch
vercel --prod

# Or merge to main first (RECOMMENDED)
git checkout main
git merge claude/multi-agent-planning-build-011CV47hpHM5iAnNt7VtbqD1
git push origin main

# Vercel auto-deploys from main (if configured)
```

### 4.6 Monitor Deployment
```bash
# Watch deployment logs
vercel logs --follow

# Or in Vercel Dashboard:
# https://vercel.com/[team]/hoostn/deployments
```

---

## 🌐 STEP 5: CONFIGURE CUSTOM DOMAIN

### 5.1 Add Domain to Vercel
```bash
# Vercel Dashboard → Project → Settings → Domains
# Add domain: hoostn.com
# Add domain: www.hoostn.com (optional)
```

### 5.2 Update DNS Records
```bash
# In your DNS provider (e.g., Cloudflare, Namecheap):

# For apex domain (hoostn.com):
Type: A
Name: @
Value: 76.76.21.21  # Vercel IP

# For www subdomain:
Type: CNAME
Name: www
Value: cname.vercel-dns.com

# Wait 5-60 minutes for DNS propagation
```

### 5.3 Verify SSL
```bash
# Vercel auto-provisions Let's Encrypt certificate
# Check: https://hoostn.com should show 🔒
```

---

## 🔗 STEP 6: CONFIGURE WEBHOOKS

### 6.1 Stripe Webhook
```bash
# Stripe Dashboard → Developers → Webhooks
# Add endpoint:
URL: https://hoostn.com/api/stripe/webhook
Events: payment_intent.*, charge.refunded, account.updated

# After creating:
# Copy webhook signing secret
# Add to Vercel env vars:
STRIPE_WEBHOOK_SECRET=whsec_...

# Redeploy to apply:
vercel --prod
```

### 6.2 Test Stripe Webhook
```bash
# Stripe Dashboard → Webhooks → [your endpoint] → Send test webhook
# Select event: payment_intent.succeeded
# Check Vercel logs for successful processing
```

### 6.3 Verify Cron Job
```bash
# The OTA sync cron runs every 30 minutes automatically
# Vercel Dashboard → Deployments → [latest] → Functions → Crons

# Manual test:
curl -X GET https://hoostn.com/api/cron/ota-sync \
  -H "Authorization: Bearer [CRON_SECRET]"

# Should return: {"success":true,...}
```

---

## 🧪 STEP 7: SMOKE TESTING

### 7.1 Homepage
```bash
curl -I https://hoostn.com
# Expected: HTTP/2 200
```

### 7.2 Authentication
```bash
# Visit: https://hoostn.com/login
# Test signup flow
# Verify magic link email sent
```

### 7.3 Database Connection
```bash
# Visit: https://hoostn.com/api/health
# Expected: {"status":"ok","database":"connected"}
```

### 7.4 Stripe Connect
```bash
# Visit: https://hoostn.com/dashboard/settings/payments
# Click "Connect with Stripe"
# Complete onboarding (test mode first)
# Verify status shows "Connected"
```

### 7.5 OTA Sync
```bash
# Visit: https://hoostn.com/dashboard/ota
# Add test Airbnb iCal URL
# Click "Sync Now"
# Verify reservations imported
```

### 7.6 Calendar
```bash
# Visit: https://hoostn.com/dashboard/calendar
# Verify calendar loads
# Select properties/lots
# Verify reservations display
```

### 7.7 AI Chat
```bash
# Create test thread
# Send message: "Is the property available?"
# Verify AI responds
# Check confidence score
```

---

## 📈 STEP 8: MONITORING SETUP

### 8.1 Vercel Analytics
```bash
# Enabled by default
# View: Vercel Dashboard → Analytics
```

### 8.2 Error Tracking (Sentry)
```bash
# Sign up: https://sentry.io
# Create project: hoostn-production
# Get DSN

# Add to Vercel env:
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Install Sentry:
npm install @sentry/nextjs

# Configure sentry.client.config.js, sentry.server.config.js
# See: /docs/SENTRY_SETUP.md
```

### 8.3 Uptime Monitoring
```bash
# Sign up: https://uptimerobot.com (free)
# Add monitors:
1. https://hoostn.com (5 min interval)
2. https://hoostn.com/api/health (5 min interval)
3. https://hoostn.com/dashboard (10 min interval)

# Configure alerts:
- Email: team@hoostn.com
- Slack: #alerts channel (optional)
```

### 8.4 Database Monitoring
```bash
# Supabase Dashboard → Settings → API
# Enable:
- Connection pooling (PgBouncer)
- Statement timeout: 60s
- Max connections: 25

# Monitor:
- Database size
- Query performance
- Table sizes
- Index usage
```

---

## 🔒 STEP 9: SECURITY HARDENING

### 9.1 Environment Variables
```bash
# Verify all secrets are in Vercel env (not in code)
# Rotate any exposed keys immediately
```

### 9.2 Rate Limiting
```bash
# Install Upstash Redis (free tier):
npm install @upstash/ratelimit @upstash/redis

# Add to env:
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Configure in middleware.ts (already has examples)
```

### 9.3 Security Headers
```bash
# Already configured in vercel.json
# Verify via: https://securityheaders.com/?q=hoostn.com
```

### 9.4 Backup Strategy
```bash
# Supabase Pro includes:
- Daily automated backups (7 days retention)
- Point-in-time recovery

# Manual backup:
npx supabase db dump -f backup_$(date +%Y%m%d).sql

# Store backups in secure location (S3, Google Drive)
```

---

## 📝 STEP 10: DOCUMENTATION & HANDOFF

### 10.1 Create Operations Runbook
```bash
# Document in /docs/OPERATIONS_RUNBOOK.md:
- How to deploy updates
- How to rollback
- How to access logs
- Emergency contacts
- Incident response procedures
```

### 10.2 Update README
```bash
# Add production URLs
# Add deployment badge
# Add monitoring links
```

### 10.3 Team Access
```bash
# Vercel: Invite team members
# Supabase: Invite team members
# Stripe: Invite team members (view-only for non-admins)
# Sentry: Invite team members
```

---

## 🚨 ROLLBACK PROCEDURE

### If Deployment Fails
```bash
# Method 1: Vercel Dashboard
# Go to: Deployments → Previous deployment → Promote to Production

# Method 2: CLI
vercel rollback

# Method 3: Redeploy previous commit
git revert HEAD
git push origin main
```

### If Database Migration Fails
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql

# Or use Supabase point-in-time recovery:
# Supabase Dashboard → Settings → Database → Point in Time Recovery
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Immediate (Day 1)
- [ ] All smoke tests passing
- [ ] Stripe test transaction successful
- [ ] OTA sync working
- [ ] AI chat responding
- [ ] Error tracking active
- [ ] Uptime monitoring configured
- [ ] Team notified of launch

### Week 1
- [ ] Monitor error rates (< 0.1%)
- [ ] Monitor response times (< 500ms p95)
- [ ] Review first 100 AI conversations
- [ ] Tune confidence threshold if needed
- [ ] Verify all emails sending
- [ ] Verify all webhooks processing

### Month 1
- [ ] Review analytics (users, revenue, bookings)
- [ ] Optimize slow queries
- [ ] Review and respond to user feedback
- [ ] Plan Phase 2 features
- [ ] Security audit completed

---

## 📊 SUCCESS METRICS

### Technical Health
- Uptime: > 99.9%
- Page load time (p95): < 3 seconds
- API response time (p95): < 500ms
- Error rate: < 0.1%
- Build time: < 5 minutes

### Business Metrics
- New user signups
- Properties onboarded
- Bookings created
- Revenue generated
- AI chat resolution rate

---

## 🆘 SUPPORT & TROUBLESHOOTING

### Common Issues

**1. Build fails on Vercel**
```bash
# Check build logs:
vercel logs --since 1h

# Common fixes:
- Verify Node version: 18+
- Clear build cache: Vercel Dashboard → Settings → Clear Cache
- Check environment variables
```

**2. Database connection fails**
```bash
# Verify env vars are set correctly
# Check Supabase project status
# Verify RLS policies allow access
```

**3. Stripe webhook not receiving events**
```bash
# Verify webhook URL is correct
# Check webhook signing secret
# Verify endpoint is publicly accessible
# Review Stripe webhook logs
```

**4. Cron job not running**
```bash
# Verify vercel.json has crons configured
# Check CRON_SECRET is set
# View cron logs: Vercel Dashboard → Functions → Crons
```

### Emergency Contacts
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io
- Stripe Support: https://support.stripe.com

---

## 🎉 DEPLOYMENT COMPLETE!

Once all steps are complete, your hoostn.com platform is live in production!

**Next Steps:**
1. Announce launch
2. Onboard first properties
3. Monitor closely for 48 hours
4. Collect user feedback
5. Plan Phase 2 features

**Congratulations on your successful deployment!** 🚀
