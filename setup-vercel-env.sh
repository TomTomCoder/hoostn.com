#!/bin/bash

# Hoostn.com - Vercel Environment Variables Setup Script
# This script reads .env.production and sets all variables in Vercel

set -e

echo "🔧 Hoostn.com - Vercel Environment Variables Setup"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create and fill in .env.production first"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &>/dev/null; then
    echo -e "${YELLOW}Not logged in to Vercel. Logging in...${NC}"
    vercel login
fi

# Check if project is linked
if [ ! -d ".vercel" ]; then
    echo -e "${RED}Error: Project not linked to Vercel${NC}"
    echo "Run: vercel link"
    exit 1
fi

echo -e "${BLUE}Reading .env.production...${NC}"
echo ""

# Array to track which variables are set
declare -a set_vars=()
declare -a skipped_vars=()

# Read .env.production and set each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ "$key" =~ ^#.*$ ]] || [ -z "$key" ]; then
        continue
    fi

    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Skip if value is placeholder
    if [[ "$value" =~ ^(your-|GENERATE_|\.\.\.|\.\.\.$) ]] || [ -z "$value" ]; then
        echo -e "${YELLOW}⊘ Skipping $key (placeholder value)${NC}"
        skipped_vars+=("$key")
        continue
    fi

    # Set in Vercel
    echo -e "${BLUE}→ Setting $key...${NC}"
    echo "$value" | vercel env add "$key" production --force &>/dev/null || {
        echo -e "${RED}✗ Failed to set $key${NC}"
        continue
    }
    echo -e "${GREEN}✓ Set $key${NC}"
    set_vars+=("$key")

done < .env.production

echo ""
echo "=================================================="
echo -e "${GREEN}Summary:${NC}"
echo -e "${GREEN}✓ Successfully set: ${#set_vars[@]} variables${NC}"
echo -e "${YELLOW}⊘ Skipped: ${#skipped_vars[@]} variables (placeholders)${NC}"
echo ""

if [ ${#skipped_vars[@]} -gt 0 ]; then
    echo -e "${YELLOW}Variables that need manual setup:${NC}"
    for var in "${skipped_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Update .env.production with real values and run this script again"
fi

echo ""
echo -e "${GREEN}✓ Environment variables setup complete!${NC}"
echo ""
echo "Verify in Vercel Dashboard:"
echo "https://vercel.com/dashboard/*/settings/environment-variables"
