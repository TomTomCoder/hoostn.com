# 🚀 Deploy Hoostn.com to Production - Quick Start

## ✅ Current Status

Your hoostn.com platform is **ready for production deployment**!

- ✓ All 5 major features completed (Stripe Connect, OTA Sync, Calendar, AI Chat, E2E Tests)
- ✓ Database migrations ready (7 migrations)
- ✓ Deployment automation scripts created
- ✓ Configuration templates prepared
- ✓ Documentation complete

---

## 🎯 Choose Your Deployment Method

### Option A: Automated Deployment (Recommended) ⚡

**Best for:** First-time deployment, comprehensive guidance

```bash
./deploy-production.sh
```

This interactive script will guide you through:
1. Pre-deployment verification
2. Vercel project setup
3. Environment variables (30+ variables)
4. Database migrations (7 migrations)
5. Application deployment
6. Production verification tests

**Time:** 30-60 minutes

---

### Option B: Quick Deploy (Experienced Users) 🏃

**Best for:** Experienced users with everything configured

```bash
# 1. Configure environment
nano .env.production  # Fill in all production values

# 2. Set environment variables
./setup-vercel-env.sh

# 3. Apply database migrations
./setup-production-db.sh

# 4. Deploy
./deploy-to-vercel.sh

# 5. Verify
./verify-production.sh
```

**Time:** 15-20 minutes (if pre-configured)

---

## 📋 What You Need Before Starting

### Required Accounts
- [ ] **Vercel Account** - https://vercel.com/signup
- [ ] **Supabase Account** (Production project) - https://supabase.com
- [ ] **Stripe Account** (Live mode enabled) - https://dashboard.stripe.com

### Required API Keys
- [ ] **Supabase Production URL and Keys**
  - Get from: Supabase Dashboard → Your Production Project → Settings → API
  - Need: URL, Anon Key, Service Role Key

- [ ] **Stripe Live Mode Keys**
  - Get from: Stripe Dashboard → Developers → API Keys (toggle to Live)
  - Need: Publishable Key, Secret Key

- [ ] **Resend API Key**
  - Get from: https://resend.com/api-keys
  - Need: API Key, From Email (noreply@hoostn.com)

- [ ] **Google Gemini API Key**
  - Get from: https://aistudio.google.com/app/apikey
  - For: AI chat system

- [ ] **OpenRouter API Key**
  - Get from: https://openrouter.ai/keys
  - For: AI chat fallback

### Optional (can add later)
- [ ] Twilio (SMS notifications)
- [ ] Booking.com API (OTA integration)
- [ ] Custom domain (hoostn.com)

---

## 🚀 Quick Deployment (Step by Step)

### Step 1: Configure Production Environment (5 min)

Edit `.env.production` with your production credentials:

```bash
nano .env.production
```

Replace all placeholder values with real production credentials:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Live mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@hoostn.com

# AI
GEMINI_API_KEY=AIzaSy...
OPENROUTER_API_KEY=sk-or-v1-...

# Security
CRON_SECRET=$(openssl rand -base64 32)  # Generate this

# URLs
NEXT_PUBLIC_APP_URL=https://hoostn.com
NEXT_PUBLIC_API_URL=https://hoostn.com/api
NEXT_PUBLIC_SITE_URL=https://hoostn.com

NODE_ENV=production
```

---

### Step 2: Run Automated Deployment (30-60 min)

```bash
./deploy-production.sh
```

The script will:
- ✓ Verify your setup
- ✓ Log in to Vercel
- ✓ Set environment variables
- ✓ Apply database migrations
- ✓ Deploy application
- ✓ Run verification tests

**Follow the interactive prompts** - the script will guide you through everything!

---

### Step 3: Post-Deployment Configuration (10 min)

After deployment completes, configure these final items:

#### A. Stripe Webhook
```bash
# In Stripe Dashboard:
# 1. Go to: Developers → Webhooks → Add endpoint
# 2. Endpoint URL: https://hoostn.com/api/stripe/webhook
# 3. Events to send:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - charge.refunded
#    - charge.succeeded
#    - account.updated
# 4. Copy webhook signing secret
# 5. Add to Vercel:
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the webhook secret
# 6. Redeploy:
vercel --prod
```

#### B. Custom Domain (Optional)
```bash
# In Vercel Dashboard:
# 1. Go to: Settings → Domains
# 2. Add: hoostn.com
# 3. Add: www.hoostn.com (optional)
# 4. Update DNS at your registrar:
#    Type: A
#    Name: @
#    Value: 76.76.21.21
#
#    Type: CNAME
#    Name: www
#    Value: cname.vercel-dns.com
# 5. Wait for DNS propagation (5-60 min)
```

#### C. Verify Cron Job
```bash
# Test OTA sync cron job:
curl -X GET https://hoostn.com/api/cron/ota-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return: {"success":true,...}
```

---

### Step 4: Run Smoke Tests (2 min)

```bash
./verify-production.sh https://hoostn.com
```

This will test:
- ✓ Homepage accessibility
- ✓ API health
- ✓ Authentication pages
- ✓ Protected routes
- ✓ Webhooks
- ✓ Security headers
- ✓ SSL certificate

---

## 🎉 Deployment Complete!

Once all steps are done, your platform is live at **https://hoostn.com**!

### Next Steps

1. **Set up monitoring** (Day 1):
   - Sign up for Sentry: https://sentry.io
   - Sign up for UptimeRobot: https://uptimerobot.com
   - Configure alerts

2. **Test all features** (Day 1-2):
   - [ ] User signup/login
   - [ ] Property creation
   - [ ] Lot management
   - [ ] Booking engine
   - [ ] Stripe Connect onboarding
   - [ ] OTA sync (Airbnb iCal)
   - [ ] Calendar multi-lot view
   - [ ] AI chat system

3. **Security audit** (Week 1):
   - [ ] Verify all secrets in Vercel (not in code)
   - [ ] Test rate limiting
   - [ ] Review RLS policies
   - [ ] Enable database backups
   - [ ] Document incident response

4. **Performance optimization** (Week 1):
   - [ ] Monitor response times
   - [ ] Optimize slow queries
   - [ ] Review bundle size
   - [ ] Enable image optimization

5. **Business launch** (Week 2+):
   - [ ] Onboard first properties
   - [ ] Test real bookings
   - [ ] Gather user feedback
   - [ ] Plan Phase 2 features

---

## 📚 Additional Resources

- **Detailed Deployment Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Script Documentation:** `DEPLOYMENT_SCRIPTS.md`
- **Project README:** `README.md`

---

## 🆘 Troubleshooting

### Deployment failed?
```bash
# Check Vercel logs
vercel logs --follow

# Common issues:
# 1. Missing environment variables
# 2. Database connection issues
# 3. Build errors

# Quick rollback if needed:
vercel rollback
```

### Tests failing?
```bash
# Re-run verification
./verify-production.sh https://hoostn.com

# Check specific endpoint
curl -I https://hoostn.com/api/health
```

### Need help?
- **Vercel:** support@vercel.com
- **Supabase:** support@supabase.io
- **Stripe:** https://support.stripe.com

---

## 💡 Pro Tips

1. **Create backups before migration:**
   ```bash
   npx supabase db dump -f backup_$(date +%Y%m%d).sql
   ```

2. **Test environment variables:**
   ```bash
   vercel env ls production
   ```

3. **Monitor deployment:**
   ```bash
   vercel logs --follow
   ```

4. **Quick redeploy:**
   ```bash
   vercel --prod
   ```

---

## 📊 What Gets Deployed

### Features (100% Complete)
- ✓ Authentication system (magic links, OAuth)
- ✓ Property management (CRUD, images, amenities)
- ✓ Lot management (multi-lot properties, availability)
- ✓ Booking engine (public booking, payments)
- ✓ Stripe Connect (payment processing, 5% platform fee)
- ✓ OTA Sync (Airbnb iCal, conflict detection)
- ✓ Calendar (multi-lot view, bulk operations)
- ✓ AI Chat (Gemini-powered, auto-escalation)
- ✓ E2E Tests (150+ tests, 80% coverage)

### Database
- 7 new migrations
- 15+ new tables
- RLS policies enabled
- Indexes optimized
- PostGIS enabled

### Infrastructure
- Next.js 14 (App Router)
- Vercel (serverless)
- Supabase (PostgreSQL)
- Stripe (payments)
- Resend (email)
- Gemini (AI)

---

**Ready to deploy? Run:**

```bash
./deploy-production.sh
```

**Let's make this happen! 🚀**
