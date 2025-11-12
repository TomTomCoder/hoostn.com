#!/bin/bash

# Hoostn.com - Complete Production Deployment Orchestrator
# This master script guides through the entire deployment process

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  🚀 Hoostn.com - Production Deployment v1.0   ║"
echo "║  Complete Platform Deployment Orchestrator     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Deployment checklist
declare -A checklist=(
    ["git_clean"]=0
    ["vercel_linked"]=0
    ["env_vars"]=0
    ["db_migrated"]=0
    ["deployed"]=0
    ["verified"]=0
)

# Helper function to print section
print_section() {
    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
}

# Helper function to check status
check_status() {
    local key="$1"
    if [ "${checklist[$key]}" -eq 1 ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
}

# Print deployment overview
print_section "DEPLOYMENT OVERVIEW"
echo "This script will guide you through:"
echo ""
echo "  1. 🔍 Pre-deployment verification"
echo "  2. 🔗 Vercel project setup"
echo "  3. 🔧 Environment variables configuration"
echo "  4. 🗄️  Database migration to production"
echo "  5. 🚀 Application deployment"
echo "  6. 🧪 Production verification"
echo ""
echo "Estimated time: 30-60 minutes"
echo "Required: Supabase account, Vercel account, Stripe account"
echo ""
read -p "Ready to begin? (yes/no): " start_confirm
if [ "$start_confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# ============================================
# STEP 1: Pre-deployment verification
# ============================================
print_section "STEP 1: Pre-deployment Verification"

echo -e "${BLUE}Checking git status...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ Git working directory is clean${NC}"
    checklist["git_clean"]=1
else
    echo -e "${RED}✗ You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Commit changes now? (yes/no): " commit_confirm
    if [ "$commit_confirm" = "yes" ]; then
        git add .
        read -p "Commit message: " commit_msg
        git commit -m "$commit_msg"
        git push
        echo -e "${GREEN}✓ Changes committed and pushed${NC}"
        checklist["git_clean"]=1
    else
        echo -e "${RED}Please commit changes before deploying${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Checking Vercel CLI...${NC}"
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓ Vercel CLI installed: $(vercel -v)${NC}"
else
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
fi

# ============================================
# STEP 2: Vercel Project Setup
# ============================================
print_section "STEP 2: Vercel Project Setup"

echo "This step will:"
echo "  - Log in to Vercel"
echo "  - Link this repository to a Vercel project"
echo ""
read -p "Continue? (yes/no): " continue_confirm
if [ "$continue_confirm" != "yes" ]; then
    echo "Skipping Vercel setup..."
else
    echo ""
    echo -e "${BLUE}Running Vercel setup...${NC}"
    ./deploy-to-vercel.sh || {
        echo -e "${RED}Vercel setup failed${NC}"
        exit 1
    }
    checklist["vercel_linked"]=1
fi

# ============================================
# STEP 3: Environment Variables
# ============================================
print_section "STEP 3: Environment Variables Configuration"

echo "You need to configure 30+ environment variables for production."
echo ""
echo "Options:"
echo "  A. Use automated script (recommended)"
echo "  B. Set manually via Vercel Dashboard"
echo "  C. Skip (already configured)"
echo ""
read -p "Choose option (A/B/C): " env_option

case "$env_option" in
    A|a)
        echo ""
        echo -e "${BLUE}Step 1: Edit .env.production with your production values${NC}"
        echo ""
        echo "Opening .env.production in editor..."
        echo "Replace all placeholder values with real production credentials:"
        echo "  - Supabase URLs and keys"
        echo "  - Stripe live mode keys"
        echo "  - Resend API key"
        echo "  - Gemini & OpenRouter keys"
        echo "  - Generate CRON_SECRET: openssl rand -base64 32"
        echo ""
        read -p "Press Enter when .env.production is ready..."

        echo ""
        echo -e "${BLUE}Step 2: Running automated setup...${NC}"
        ./setup-vercel-env.sh || {
            echo -e "${YELLOW}Some variables may need manual setup${NC}"
        }
        checklist["env_vars"]=1
        ;;
    B|b)
        echo ""
        echo "Set variables manually at:"
        echo "https://vercel.com/dashboard/*/settings/environment-variables"
        echo ""
        echo "See .env.production for the complete list"
        read -p "Press Enter when all variables are set..."
        checklist["env_vars"]=1
        ;;
    C|c)
        echo -e "${GREEN}Skipping environment variables setup${NC}"
        checklist["env_vars"]=1
        ;;
esac

# ============================================
# STEP 4: Database Migration
# ============================================
print_section "STEP 4: Production Database Migration"

echo -e "${YELLOW}⚠️  WARNING: This will modify your production database!${NC}"
echo ""
echo "This step will:"
echo "  - Link to your production Supabase project"
echo "  - Apply 7 database migrations"
echo "  - Set up all tables, indexes, and RLS policies"
echo ""
read -p "Continue with database migration? (yes/no): " db_confirm

if [ "$db_confirm" = "yes" ]; then
    echo ""
    echo -e "${BLUE}Running database migration...${NC}"
    ./setup-production-db.sh || {
        echo -e "${RED}Database migration failed${NC}"
        exit 1
    }
    checklist["db_migrated"]=1
else
    echo -e "${YELLOW}⚠️  Skipping database migration${NC}"
    echo "Note: Application won't work without migrations!"
fi

# ============================================
# STEP 5: Deploy to Vercel
# ============================================
print_section "STEP 5: Deploy Application to Vercel"

echo "Ready to deploy to production!"
echo ""
echo "Current branch: $(git branch --show-current)"
echo ""
echo "This will:"
echo "  - Build the Next.js application"
echo "  - Deploy to Vercel production"
echo "  - Configure custom domain (hoostn.com)"
echo ""
read -p "Deploy now? (yes/no): " deploy_confirm

if [ "$deploy_confirm" = "yes" ]; then
    echo ""
    echo -e "${BLUE}Deploying to Vercel...${NC}"
    vercel --prod
    checklist["deployed"]=1
    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
else
    echo -e "${YELLOW}Skipping deployment${NC}"
fi

# ============================================
# STEP 6: Production Verification
# ============================================
print_section "STEP 6: Production Verification"

if [ "${checklist[deployed]}" -eq 1 ]; then
    echo "Running smoke tests on production..."
    echo ""

    read -p "Enter your production URL (default: https://hoostn.com): " prod_url
    prod_url=${prod_url:-https://hoostn.com}

    echo ""
    ./verify-production.sh "$prod_url" && {
        checklist["verified"]=1
    } || {
        echo -e "${YELLOW}Some tests failed. Review the output above.${NC}"
    }
else
    echo -e "${YELLOW}Skipping verification (deployment not completed)${NC}"
fi

# ============================================
# DEPLOYMENT SUMMARY
# ============================================
print_section "DEPLOYMENT SUMMARY"

echo "Status of deployment steps:"
echo ""
echo "  $(check_status git_clean) Git repository clean"
echo "  $(check_status vercel_linked) Vercel project linked"
echo "  $(check_status env_vars) Environment variables configured"
echo "  $(check_status db_migrated) Database migrations applied"
echo "  $(check_status deployed) Application deployed"
echo "  $(check_status verified) Production verified"
echo ""

# Count completed steps
completed=0
for key in "${!checklist[@]}"; do
    completed=$((completed + checklist[$key]))
done

if [ $completed -eq 6 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 DEPLOYMENT COMPLETE! 🎉                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ All steps completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Deployment partially complete ($completed/6 steps)${NC}"
    echo ""
    echo "Remaining tasks:"
    [ "${checklist[git_clean]}" -eq 0 ] && echo "  - Clean git repository"
    [ "${checklist[vercel_linked]}" -eq 0 ] && echo "  - Link Vercel project"
    [ "${checklist[env_vars]}" -eq 0 ] && echo "  - Configure environment variables"
    [ "${checklist[db_migrated]}" -eq 0 ] && echo "  - Apply database migrations"
    [ "${checklist[deployed]}" -eq 0 ] && echo "  - Deploy application"
    [ "${checklist[verified]}" -eq 0 ] && echo "  - Verify production"
fi

# ============================================
# NEXT STEPS
# ============================================
echo ""
print_section "NEXT STEPS"

echo "1. 🔗 Configure Stripe Webhook:"
echo "   URL: https://hoostn.com/api/stripe/webhook"
echo "   Events: payment_intent.*, charge.refunded, account.updated"
echo ""
echo "2. 🌐 Set up custom domain:"
echo "   Vercel Dashboard → Domains → Add hoostn.com"
echo ""
echo "3. 📊 Set up monitoring:"
echo "   - Sentry: https://sentry.io"
echo "   - UptimeRobot: https://uptimerobot.com"
echo "   - Vercel Analytics (enabled by default)"
echo ""
echo "4. 🔒 Security:"
echo "   - Verify all secrets are in Vercel (not in code)"
echo "   - Set up rate limiting (Upstash Redis)"
echo "   - Configure backup strategy"
echo ""
echo "5. 📝 Documentation:"
echo "   - See: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "   - Create operations runbook"
echo "   - Document incident response procedures"
echo ""

if [ $completed -eq 6 ]; then
    echo -e "${GREEN}🚀 Your hoostn.com platform is live in production!${NC}"
fi

echo ""
echo "For detailed information, see: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
