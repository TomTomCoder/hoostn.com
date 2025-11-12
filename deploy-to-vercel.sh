#!/bin/bash

# Hoostn.com - Production Deployment Script
# This script automates the Vercel deployment process

set -e

echo "🚀 Hoostn.com - Production Deployment to Vercel"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify git status
echo -e "${BLUE}Step 1: Verifying git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit them first.${NC}"
    git status --short
    exit 1
fi
echo -e "${GREEN}✓ Git status clean${NC}"
echo ""

# Step 2: Login to Vercel
echo -e "${BLUE}Step 2: Logging in to Vercel...${NC}"
if ! vercel whoami &>/dev/null; then
    echo "Please log in to Vercel:"
    vercel login
else
    echo -e "${GREEN}✓ Already logged in to Vercel${NC}"
fi
echo ""

# Step 3: Link project
echo -e "${BLUE}Step 3: Linking Vercel project...${NC}"
if [ ! -d ".vercel" ]; then
    echo "Linking project to Vercel..."
    vercel link
else
    echo -e "${GREEN}✓ Project already linked${NC}"
fi
echo ""

# Step 4: Environment Variables
echo -e "${YELLOW}Step 4: Environment Variables Setup${NC}"
echo "You need to set up production environment variables in Vercel."
echo ""
echo "Required variables (30+):"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - RESEND_API_KEY"
echo "  - RESEND_FROM_EMAIL"
echo "  - GEMINI_API_KEY"
echo "  - OPENROUTER_API_KEY"
echo "  - NEXT_PUBLIC_APP_URL=https://hoostn.com"
echo "  - NEXT_PUBLIC_API_URL=https://hoostn.com/api"
echo "  - NEXT_PUBLIC_SITE_URL=https://hoostn.com"
echo "  - CRON_SECRET (generate with: openssl rand -base64 32)"
echo "  - NODE_ENV=production"
echo ""
echo "Options:"
echo "  1. Set via CLI: vercel env add VARIABLE_NAME production"
echo "  2. Set via Dashboard: https://vercel.com/dashboard/*/settings/environment-variables"
echo ""
read -p "Have you set up all environment variables? (yes/no): " env_setup
if [ "$env_setup" != "yes" ]; then
    echo -e "${YELLOW}Please set up environment variables first.${NC}"
    echo "See: PRODUCTION_DEPLOYMENT_GUIDE.md (Step 4.4)"
    exit 0
fi
echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Step 5: Deploy to production
echo -e "${BLUE}Step 5: Deploying to Vercel production...${NC}"
echo "This will deploy from branch: $(git branch --show-current)"
echo ""
read -p "Deploy to production now? (yes/no): " deploy_confirm
if [ "$deploy_confirm" = "yes" ]; then
    echo "Deploying..."
    vercel --prod
    echo ""
    echo -e "${GREEN}✓ Deployment complete!${NC}"
else
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi
echo ""

# Step 6: Post-deployment checklist
echo -e "${BLUE}Step 6: Post-Deployment Checklist${NC}"
echo "================================================"
echo ""
echo "[ ] 1. Verify deployment at: https://hoostn.com"
echo "[ ] 2. Configure custom domain (if not done)"
echo "[ ] 3. Set up Stripe webhook: https://hoostn.com/api/stripe/webhook"
echo "[ ] 4. Apply database migrations to production Supabase"
echo "[ ] 5. Test authentication flow"
echo "[ ] 6. Test Stripe Connect onboarding"
echo "[ ] 7. Test OTA sync functionality"
echo "[ ] 8. Test AI chat system"
echo "[ ] 9. Set up monitoring (Sentry, UptimeRobot)"
echo "[ ] 10. Run smoke tests"
echo ""
echo "See: PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo -e "${GREEN}🎉 Deployment script completed!${NC}"
