#!/bin/bash

# Hoostn.com - Complete Secrets Setup (All Platforms)
# This master script guides through GitHub, Vercel, and Supabase configuration

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  🔐 Hoostn.com - Complete Secrets Setup       ║"
echo "║  GitHub • Vercel • Supabase Configuration     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Checklist
declare -A completed=(
    ["supabase"]=0
    ["vercel"]=0
    ["github"]=0
)

# Helper functions
print_section() {
    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
}

check_mark() {
    if [ "$1" -eq 1 ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}○${NC}"
    fi
}

# Introduction
print_section "WELCOME TO SECRETS SETUP"

echo "This script will help you configure secrets for:"
echo ""
echo "  ${BOLD}1. Supabase${NC} - Database and backend"
echo "     • Create production project"
echo "     • Configure authentication"
echo "     • Set up storage and extensions"
echo "     • Get API keys"
echo ""
echo "  ${BOLD}2. Vercel${NC} - Application hosting"
echo "     • Link project"
echo "     • Add 30+ environment variables"
echo "     • Configure production deployment"
echo ""
echo "  ${BOLD}3. GitHub${NC} - CI/CD and version control"
echo "     • Add repository secrets"
echo "     • Enable automated deployments"
echo "     • Configure workflows"
echo ""
echo "⏱️  Estimated time: 45-60 minutes"
echo "📋 You'll need: Account access to all three platforms"
echo ""
read -p "Ready to begin? (yes/no): " begin

if [ "$begin" != "yes" ]; then
    echo "Setup cancelled. Run again when ready: ./setup-all-secrets.sh"
    exit 0
fi

# ==============================================
# PHASE 1: Supabase Setup (Foundation)
# ==============================================
print_section "PHASE 1: Supabase Configuration (15-20 min)"

echo "Why Supabase first?"
echo "  → Vercel needs Supabase API keys"
echo "  → GitHub needs Supabase project reference"
echo "  → This is your data foundation"
echo ""
read -p "Configure Supabase now? (yes/skip): " do_supabase

if [ "$do_supabase" = "yes" ]; then
    echo ""
    echo -e "${BLUE}Launching Supabase setup...${NC}"
    echo ""

    if [ -f "./setup-supabase-secrets.sh" ]; then
        chmod +x ./setup-supabase-secrets.sh
        ./setup-supabase-secrets.sh
        completed["supabase"]=1
    else
        echo -e "${RED}Error: setup-supabase-secrets.sh not found${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Skipped Supabase setup${NC}"
    echo "Note: You'll need to set it up manually before Vercel"
fi

# ==============================================
# PHASE 2: Vercel Setup (Application)
# ==============================================
print_section "PHASE 2: Vercel Configuration (20-30 min)"

echo "Vercel environment variables needed:"
echo "  → Supabase keys (from Phase 1)"
echo "  → Stripe keys (live mode)"
echo "  → Email service (Resend)"
echo "  → AI keys (Gemini, OpenRouter)"
echo "  → Application URLs"
echo "  → Security secrets"
echo ""

if [ "${completed[supabase]}" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Supabase not configured yet${NC}"
    echo "You'll need Supabase API keys for Vercel."
    echo ""
fi

read -p "Configure Vercel now? (yes/skip): " do_vercel

if [ "$do_vercel" = "yes" ]; then
    echo ""
    echo -e "${BLUE}Launching Vercel setup...${NC}"
    echo ""

    if [ -f "./setup-vercel-secrets.sh" ]; then
        chmod +x ./setup-vercel-secrets.sh
        ./setup-vercel-secrets.sh
        completed["vercel"]=1
    else
        echo -e "${RED}Error: setup-vercel-secrets.sh not found${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Skipped Vercel setup${NC}"
fi

# ==============================================
# PHASE 3: GitHub Setup (CI/CD)
# ==============================================
print_section "PHASE 3: GitHub Configuration (5-10 min)"

echo "GitHub secrets needed:"
echo "  → Vercel token (for deployments)"
echo "  → Vercel project IDs"
echo "  → Supabase access token"
echo "  → Supabase project reference"
echo ""

if [ "${completed[vercel]}" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Note: Vercel not configured yet${NC}"
    echo "You'll need Vercel project ID from .vercel/project.json"
    echo ""
fi

read -p "Configure GitHub now? (yes/skip): " do_github

if [ "$do_github" = "yes" ]; then
    echo ""
    echo -e "${BLUE}Launching GitHub setup...${NC}"
    echo ""

    if [ -f "./setup-github-secrets.sh" ]; then
        chmod +x ./setup-github-secrets.sh
        ./setup-github-secrets.sh
        completed["github"]=1
    else
        echo -e "${RED}Error: setup-github-secrets.sh not found${NC}"
    fi
else
    echo -e "${YELLOW}⊘ Skipped GitHub setup${NC}"
fi

# ==============================================
# COMPLETION SUMMARY
# ==============================================
print_section "SETUP SUMMARY"

echo "Configuration status:"
echo ""
echo "  $(check_mark ${completed[supabase]}) Supabase - Database and backend"
echo "  $(check_mark ${completed[vercel]}) Vercel - Application hosting"
echo "  $(check_mark ${completed[github]}) GitHub - CI/CD automation"
echo ""

# Count completed
total_completed=$((completed[supabase] + completed[vercel] + completed[github]))

if [ $total_completed -eq 3 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL SECRETS CONFIGURED! 🎉                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ Your deployment environment is fully configured!${NC}"
    echo ""
elif [ $total_completed -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No secrets configured${NC}"
    echo ""
    echo "Run individual setup scripts:"
    echo "  ./setup-supabase-secrets.sh"
    echo "  ./setup-vercel-secrets.sh"
    echo "  ./setup-github-secrets.sh"
    echo ""
else
    echo -e "${YELLOW}⚠️  Partial setup completed ($total_completed/3)${NC}"
    echo ""
    echo "Remaining tasks:"
    [ "${completed[supabase]}" -eq 0 ] && echo "  - Configure Supabase: ./setup-supabase-secrets.sh"
    [ "${completed[vercel]}" -eq 0 ] && echo "  - Configure Vercel: ./setup-vercel-secrets.sh"
    [ "${completed[github]}" -eq 0 ] && echo "  - Configure GitHub: ./setup-github-secrets.sh"
    echo ""
fi

# ==============================================
# NEXT STEPS
# ==============================================
print_section "NEXT STEPS"

echo "After all secrets are configured:"
echo ""
echo "  ${BOLD}1. Verify Secrets${NC}"
echo "     - Supabase: Check Settings → API"
echo "     - Vercel: vercel env ls production"
echo "     - GitHub: gh secret list"
echo ""
echo "  ${BOLD}2. Apply Database Migrations${NC}"
echo "     ./setup-production-db.sh"
echo ""
echo "  ${BOLD}3. Deploy to Production${NC}"
echo "     ./deploy-to-vercel.sh"
echo ""
echo "  ${BOLD}4. Configure Webhooks${NC}"
echo "     - Stripe webhook: https://hoostn.com/api/stripe/webhook"
echo "     - Add STRIPE_WEBHOOK_SECRET to Vercel"
echo ""
echo "  ${BOLD}5. Verify Deployment${NC}"
echo "     ./verify-production.sh https://hoostn.com"
echo ""
echo "  ${BOLD}6. Set Up Monitoring${NC}"
echo "     - Sentry (errors): https://sentry.io"
echo "     - UptimeRobot (uptime): https://uptimerobot.com"
echo "     - Vercel Analytics (already enabled)"
echo ""

# Summary files
echo -e "${BLUE}Summary Files Created:${NC}"
echo ""
if [ -f "supabase-production-summary.txt" ]; then
    echo "  ✓ supabase-production-summary.txt"
fi
if [ -f ".vercel/project.json" ]; then
    echo "  ✓ .vercel/project.json"
fi
echo ""

echo "Documentation:"
echo "  - Complete guide: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "  - Quick start: DEPLOY_NOW.md"
echo "  - Scripts reference: DEPLOYMENT_SCRIPTS.md"
echo ""

# Final reminder
if [ $total_completed -eq 3 ]; then
    echo -e "${GREEN}🚀 You're ready to deploy! Run: ./deploy-production.sh${NC}"
else
    echo -e "${YELLOW}Complete remaining secrets setup before deploying.${NC}"
fi

echo ""
echo "Need help? See documentation or run scripts individually."
echo ""
