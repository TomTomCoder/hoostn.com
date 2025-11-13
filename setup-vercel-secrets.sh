#!/bin/bash

# Hoostn.com - Vercel Environment Variables Setup (Interactive)
# This script helps you add ALL environment variables to Vercel

set -e

echo "🔧 Hoostn.com - Vercel Secrets Setup"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not installed. Installing...${NC}"
    npm install -g vercel
fi

# Check if logged in
echo -e "${BLUE}Step 1: Verifying Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
else
    echo -e "${GREEN}✓ Logged in as: $(vercel whoami)${NC}"
fi
echo ""

# Check if project is linked
echo -e "${BLUE}Step 2: Verifying project link...${NC}"
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}Project not linked to Vercel yet.${NC}"
    read -p "Link now? (yes/no): " link_confirm
    if [ "$link_confirm" = "yes" ]; then
        vercel link
    else
        echo -e "${RED}Project must be linked to add environment variables.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Project is linked${NC}"
fi
echo ""

# Choose setup method
echo -e "${BLUE}Step 3: Choose Setup Method${NC}"
echo ""
echo "How would you like to add environment variables?"
echo ""
echo "  ${BOLD}A)${NC} Interactive Mode (recommended for first-time setup)"
echo "     - I'll ask for each value one by one"
echo "     - Shows instructions on where to get each value"
echo "     - Best for learning what each variable does"
echo ""
echo "  ${BOLD}B)${NC} Bulk Import from .env.production"
echo "     - Reads all values from .env.production file"
echo "     - Skips placeholders automatically"
echo "     - Fast if you've already filled in .env.production"
echo ""
echo "  ${BOLD}C)${NC} Vercel Dashboard (manual)"
echo "     - Opens Vercel dashboard in browser"
echo "     - Add variables manually through UI"
echo ""
read -p "Choose method (A/B/C): " method

case "$method" in
    A|a)
        source ./scripts/vercel-interactive-setup.sh
        ;;
    B|b)
        if [ ! -f ".env.production" ]; then
            echo -e "${RED}Error: .env.production not found${NC}"
            echo "Create it first: cp .env.production.template .env.production"
            exit 1
        fi
        ./setup-vercel-env.sh
        ;;
    C|c)
        echo ""
        echo "Opening Vercel dashboard..."
        PROJECT_ID=$(cat .vercel/project.json | grep projectId | cut -d'"' -f4)
        echo ""
        echo "Add variables at:"
        echo "https://vercel.com/dashboard/*/settings/environment-variables"
        echo ""
        echo "See .env.production for the complete list of variables needed."
        echo ""
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ Vercel environment variables setup complete!${NC}"
echo ""
echo "Verify your variables:"
echo "  vercel env ls production"
echo ""
echo "Pull variables locally (for testing):"
echo "  vercel env pull .env.local"
echo ""
