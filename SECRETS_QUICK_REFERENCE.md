# 🔐 Secrets Quick Reference Card

Quick cheat sheet for all secrets needed for production deployment.

---

## 📊 Secrets Overview

| # | Variable | Platform | Where to Get | Format |
|---|----------|----------|--------------|--------|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Supabase → Settings → API | `https://xxx.supabase.co` |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Supabase → Settings → API | `eyJhbGci...` |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Supabase → Settings → API | `eyJhbGci...` |
| 4 | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Vercel | Stripe → API Keys (Live) | `pk_live_...` |
| 5 | `STRIPE_SECRET_KEY` | Vercel | Stripe → API Keys (Live) | `sk_live_...` |
| 6 | `STRIPE_WEBHOOK_SECRET` | Vercel | Stripe → Webhooks (after deploy) | `whsec_...` |
| 7 | `RESEND_API_KEY` | Vercel | Resend → API Keys | `re_...` |
| 8 | `RESEND_FROM_EMAIL` | Vercel | Your domain | `noreply@hoostn.com` |
| 9 | `GEMINI_API_KEY` | Vercel | Google AI Studio | `AIzaSy...` |
| 10 | `OPENROUTER_API_KEY` | Vercel | OpenRouter | `sk-or-v1-...` |
| 11 | `NEXT_PUBLIC_APP_URL` | Vercel | Your domain | `https://hoostn.com` |
| 12 | `NEXT_PUBLIC_API_URL` | Vercel | Your domain | `https://hoostn.com/api` |
| 13 | `NEXT_PUBLIC_SITE_URL` | Vercel | Your domain | `https://hoostn.com` |
| 14 | `CRON_SECRET` | Vercel | Generate random | `openssl rand -base64 32` |
| 15 | `NODE_ENV` | Vercel | Hardcoded | `production` |
| 16 | `VERCEL_TOKEN` | GitHub | Vercel → Account → Tokens | `vercel_...` |
| 17 | `VERCEL_ORG_ID` | GitHub | `.vercel/project.json` | `team_xxx` |
| 18 | `VERCEL_PROJECT_ID` | GitHub | `.vercel/project.json` | `prj_xxx` |
| 19 | `SUPABASE_ACCESS_TOKEN` | GitHub | Supabase → Account → Tokens | Personal token |
| 20 | `SUPABASE_PROJECT_REF` | GitHub | Supabase → Settings → General | 16-char ID |

---

## 🚀 Quick Commands

### Get Vercel IDs
```bash
cat .vercel/project.json | grep -E '(orgId|projectId)'
```

### Generate CRON_SECRET
```bash
openssl rand -base64 32
```

### List Vercel Environment Variables
```bash
vercel env ls production
```

### Add Vercel Environment Variable
```bash
echo 'SECRET_VALUE' | vercel env add VAR_NAME production
```

### List GitHub Secrets
```bash
gh secret list
```

### Add GitHub Secret
```bash
echo 'SECRET_VALUE' | gh secret set SECRET_NAME
```

---

## 🔗 Quick Links

| Service | Dashboard Link |
|---------|---------------|
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |
| GitHub | https://github.com/TomTomCoder/hoostn.com/settings/secrets/actions |
| Stripe | https://dashboard.stripe.com |
| Resend | https://resend.com |
| Google AI | https://aistudio.google.com/app/apikey |
| OpenRouter | https://openrouter.ai/keys |

---

## 📝 Setup Order

```
1. 🗄️  Supabase
   ├─ Create production project
   ├─ Configure auth providers
   ├─ Create storage buckets
   ├─ Enable extensions
   └─ Copy 3 API keys

2. 🚀 Vercel
   ├─ Link project: vercel link
   ├─ Add Supabase keys (3)
   ├─ Add Stripe keys (2)
   ├─ Add Email keys (2)
   ├─ Add AI keys (2)
   ├─ Add App URLs (3)
   ├─ Add Security (2)
   └─ Total: 15 variables

3. 🐙 GitHub
   ├─ VERCEL_TOKEN
   ├─ VERCEL_ORG_ID
   ├─ VERCEL_PROJECT_ID
   ├─ SUPABASE_ACCESS_TOKEN
   └─ SUPABASE_PROJECT_REF
```

---

## ⚡ One-Command Setup

```bash
# Interactive setup for all platforms
./setup-all-secrets.sh
```

---

## 🎯 Platform-Specific Scripts

```bash
# Supabase only (15-20 min)
./setup-supabase-secrets.sh

# Vercel only (20-30 min)
./setup-vercel-secrets.sh

# GitHub only (5-10 min)
./setup-github-secrets.sh
```

---

## 📋 Checklist

### Before Starting
- [ ] Supabase account created
- [ ] Vercel account created
- [ ] GitHub account created
- [ ] Stripe account created (live mode enabled)
- [ ] Resend account created
- [ ] Google AI Studio account
- [ ] OpenRouter account (optional)

### Supabase Setup
- [ ] Production project created
- [ ] Region selected
- [ ] Database password saved
- [ ] Auth providers configured
- [ ] Storage buckets created (4)
- [ ] Extensions enabled (postgis, pg_stat_statements)
- [ ] API keys copied (3)

### Vercel Setup
- [ ] Project linked
- [ ] Supabase keys added (3)
- [ ] Stripe keys added (2)
- [ ] Email keys added (2)
- [ ] AI keys added (2)
- [ ] URLs configured (3)
- [ ] Security secrets added (2)
- [ ] Environment variables verified

### GitHub Setup
- [ ] GitHub CLI installed
- [ ] Authenticated with gh
- [ ] VERCEL_TOKEN added
- [ ] VERCEL_ORG_ID added
- [ ] VERCEL_PROJECT_ID added
- [ ] SUPABASE_ACCESS_TOKEN added
- [ ] SUPABASE_PROJECT_REF added

### Post-Setup
- [ ] All secrets verified
- [ ] Test locally with `vercel env pull`
- [ ] Ready to deploy

---

## 🔒 Security Reminders

- ⚠️ **Never commit `.env.production` to git**
- ⚠️ **Use `service_role` key only server-side**
- ⚠️ **Rotate secrets every 90 days**
- ⚠️ **Enable 2FA on all platforms**
- ⚠️ **Keep Stripe in live mode only for production**

---

## 💾 Save This Information

Store all secrets securely in:
- 1Password
- LastPass
- Bitwarden
- Or your password manager of choice

**Never store in:**
- Git repository
- Slack/Discord
- Email
- Plain text files

---

## 🆘 Getting Help

**Can't find a secret?**
- Supabase: Settings → API
- Vercel: Project Settings → Environment Variables
- GitHub: Repository → Settings → Secrets → Actions
- Stripe: Developers → API Keys (toggle Live mode)

**Need to regenerate?**
- Most services allow regenerating API keys
- Remember to update in all environments
- Redeploy after updating

---

**Print this page for quick reference during setup!**
