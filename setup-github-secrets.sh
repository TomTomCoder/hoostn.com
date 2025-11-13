#!/bin/bash

# Hoostn.com - GitHub Secrets Setup
# This script helps you add secrets to GitHub for CI/CD workflows

set -e

echo "🔐 Hoostn.com - GitHub Secrets Setup"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI (gh) is not installed.${NC}"
    echo ""
    echo "Install it:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    echo "  Windows: https://github.com/cli/cli/releases"
    echo ""
    read -p "Install now with script? (yes/no): " install_gh
    if [ "$install_gh" = "yes" ]; then
        if command -v brew &> /dev/null; then
            brew install gh
        else
            echo -e "${RED}Please install manually from: https://cli.github.com${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo -e "${BLUE}Step 1: Authenticating with GitHub...${NC}"
echo ""

# Check if already authenticated
if ! gh auth status &> /dev/null; then
    echo "Please log in to GitHub:"
    gh auth login
else
    echo -e "${GREEN}✓ Already authenticated${NC}"
fi
echo ""

# Get repository info
echo -e "${BLUE}Step 2: Getting repository information...${NC}"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    echo -e "${YELLOW}Could not detect repository automatically.${NC}"
    read -p "Enter repository (format: owner/repo): " REPO
fi

echo "Repository: $REPO"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production not found${NC}"
    echo "Please create it first. See: DEPLOY_NOW.md"
    exit 1
fi

echo -e "${BLUE}Step 3: GitHub Secrets Needed${NC}"
echo ""
echo "GitHub secrets are used for:"
echo "  - CI/CD workflows (GitHub Actions)"
echo "  - Automated deployments"
echo "  - Running tests in CI"
echo ""
echo "Required secrets:"
echo "  1. VERCEL_TOKEN - For automated deployments"
echo "  2. VERCEL_ORG_ID - Your Vercel organization ID"
echo "  3. VERCEL_PROJECT_ID - Your Vercel project ID"
echo "  4. SUPABASE_ACCESS_TOKEN - For database operations in CI"
echo "  5. SUPABASE_PROJECT_REF - Your production project reference"
echo ""

# Function to add secret
add_secret() {
    local secret_name="$1"
    local secret_description="$2"
    local secret_instructions="$3"

    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Setting up: $secret_name${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Description:${NC} $secret_description"
    echo ""
    echo -e "${YELLOW}How to get this value:${NC}"
    echo "$secret_instructions"
    echo ""

    read -p "Do you have this value ready? (yes/skip): " has_value

    if [ "$has_value" = "yes" ]; then
        read -sp "Enter value for $secret_name: " secret_value
        echo ""

        if [ -z "$secret_value" ]; then
            echo -e "${YELLOW}⊘ Skipping $secret_name (empty value)${NC}"
            return
        fi

        # Set the secret
        echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
        echo -e "${GREEN}✓ $secret_name added successfully!${NC}"
    else
        echo -e "${YELLOW}⊘ Skipping $secret_name${NC}"
    fi
    echo ""
}

# Add each secret
echo -e "${BLUE}Step 4: Adding Secrets${NC}"
echo ""

# 1. VERCEL_TOKEN
add_secret "VERCEL_TOKEN" \
    "Authentication token for Vercel deployments" \
    "1. Go to: https://vercel.com/account/tokens
2. Click 'Create Token'
3. Name it: 'GitHub Actions - Hoostn'
4. Scope: Full Account
5. Click 'Create'
6. Copy the token (starts with 'vercel_...')"

# 2. VERCEL_ORG_ID
add_secret "VERCEL_ORG_ID" \
    "Your Vercel organization/team ID" \
    "1. Open your project in Vercel: https://vercel.com/dashboard
2. Go to Settings → General
3. Look for 'Project ID' section
4. Copy the 'Team ID' or 'Org ID' value

Alternative (from .vercel directory):
  cat .vercel/project.json | grep orgId"

# 3. VERCEL_PROJECT_ID
add_secret "VERCEL_PROJECT_ID" \
    "Your Vercel project ID" \
    "1. Open your project in Vercel: https://vercel.com/dashboard
2. Go to Settings → General
3. Copy the 'Project ID' value

Alternative (from .vercel directory):
  cat .vercel/project.json | grep projectId"

# 4. SUPABASE_ACCESS_TOKEN
add_secret "SUPABASE_ACCESS_TOKEN" \
    "Personal access token for Supabase CLI" \
    "1. Go to: https://supabase.com/dashboard/account/tokens
2. Click 'Generate New Token'
3. Name it: 'GitHub Actions - Hoostn'
4. Click 'Generate Token'
5. Copy the token

Note: This is different from your API keys!"

# 5. SUPABASE_PROJECT_REF
add_secret "SUPABASE_PROJECT_REF" \
    "Your production Supabase project reference ID" \
    "1. Go to: https://supabase.com/dashboard
2. Select your PRODUCTION project
3. Go to Settings → General
4. Copy the 'Reference ID' (looks like: abcdefghijklmnop)"

echo ""
echo -e "${BLUE}Step 5: Verifying Secrets${NC}"
echo ""

# List all secrets
echo "Secrets set in repository:"
gh secret list --repo "$REPO"

echo ""
echo -e "${GREEN}✓ GitHub secrets setup complete!${NC}"
echo ""

# Summary
echo -e "${BOLD}Summary:${NC}"
echo ""
echo "Secrets are now available for GitHub Actions workflows."
echo ""
echo "Next steps:"
echo "  1. Verify secrets: gh secret list"
echo "  2. Check workflows: .github/workflows/"
echo "  3. Push code to trigger CI/CD"
echo ""
echo "Optional: Add additional secrets for testing"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - STRIPE_SECRET_KEY (for integration tests)"
echo ""
echo "Add more secrets:"
echo "  echo 'SECRET_VALUE' | gh secret set SECRET_NAME"
echo ""
