#!/bin/bash

# Hoostn.com - Interactive Vercel Environment Variables Setup
# Guides through each variable with instructions

set -e

echo ""
echo -e "${BOLD}Interactive Environment Variables Setup${NC}"
echo "========================================"
echo ""
echo "I'll guide you through setting up each environment variable."
echo "For each one, I'll explain what it's for and where to get it."
echo ""
read -p "Press Enter to begin..."

# Function to add environment variable
add_env_var() {
    local var_name="$1"
    local description="$2"
    local instructions="$3"
    local is_secret="${4:-yes}"
    local example="${5:-}"

    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$var_name${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}What it's for:${NC}"
    echo "  $description"
    echo ""
    echo -e "${YELLOW}How to get it:${NC}"
    echo "$instructions"
    echo ""

    if [ -n "$example" ]; then
        echo -e "${YELLOW}Example format:${NC}"
        echo "  $example"
        echo ""
    fi

    read -p "Ready to add $var_name? (yes/skip): " ready

    if [ "$ready" != "yes" ]; then
        echo -e "${YELLOW}⊘ Skipped $var_name${NC}"
        return
    fi

    if [ "$is_secret" = "yes" ]; then
        read -sp "Enter value: " value
        echo ""
    else
        read -p "Enter value: " value
    fi

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⊘ Skipped (empty value)${NC}"
        return
    fi

    # Add to Vercel
    echo "$value" | vercel env add "$var_name" production --force &>/dev/null
    echo -e "${GREEN}✓ Added $var_name${NC}"
}

# ============================================
# CATEGORY 1: Supabase (Required)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 1: Supabase Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Supabase is your PostgreSQL database and backend."
echo "You need to create a PRODUCTION project first."
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Name: hoostn-production"
echo "4. Region: Choose closest to your users"
echo "5. Database password: Generate strong password"
echo "6. Click 'Create Project' (takes ~2 minutes)"
echo ""
read -p "Have you created your production Supabase project? (yes/no): " supabase_ready

if [ "$supabase_ready" != "yes" ]; then
    echo ""
    echo -e "${YELLOW}Please create your Supabase project first.${NC}"
    echo "Come back and run this script again when ready."
    exit 0
fi

add_env_var "NEXT_PUBLIC_SUPABASE_URL" \
    "Your production Supabase project URL" \
    "1. Go to: https://supabase.com/dashboard
2. Select your PRODUCTION project
3. Go to: Settings → API
4. Copy 'Project URL'" \
    "no" \
    "https://abcdefghijklmnop.supabase.co"

add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "Public anonymous key for client-side auth" \
    "1. Same page: Settings → API
2. Copy 'anon public' key (starts with 'eyJ...')" \
    "no" \
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

add_env_var "SUPABASE_SERVICE_ROLE_KEY" \
    "Server-side key with admin privileges" \
    "1. Same page: Settings → API
2. Copy 'service_role' key (starts with 'eyJ...')
3. ⚠️  Keep this secret! Never expose client-side." \
    "yes" \
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ============================================
# CATEGORY 2: Stripe (Required)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 2: Stripe Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Stripe handles all payment processing."
echo ""
echo "⚠️  IMPORTANT: Use LIVE MODE keys (not test mode)"
echo ""
echo "1. Go to: https://dashboard.stripe.com"
echo "2. Toggle to 'Live Mode' (top right)"
echo "3. Go to: Developers → API Keys"
echo ""
read -p "Ready to add Stripe keys? (yes/skip): " stripe_ready

if [ "$stripe_ready" = "yes" ]; then
    add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" \
        "Public key for client-side Stripe.js" \
        "1. Stripe Dashboard → Developers → API Keys
2. Copy 'Publishable key' (starts with 'pk_live_...')" \
        "no" \
        "pk_live_51ABC123..."

    add_env_var "STRIPE_SECRET_KEY" \
        "Secret key for server-side API calls" \
        "1. Same page
2. Copy 'Secret key' (starts with 'sk_live_...')
3. You may need to click 'Reveal test key token'" \
        "yes" \
        "sk_live_51ABC123..."

    echo ""
    echo -e "${YELLOW}Note: STRIPE_WEBHOOK_SECRET will be added after deployment${NC}"
    echo "We'll configure the webhook in step 6."
fi

# ============================================
# CATEGORY 3: Email (Required)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 3: Email Configuration (Resend)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Resend handles transactional emails (booking confirmations, etc.)"
echo ""
echo "1. Go to: https://resend.com"
echo "2. Sign up / Log in"
echo "3. Go to: API Keys → Create API Key"
echo ""
read -p "Ready to add Resend? (yes/skip): " resend_ready

if [ "$resend_ready" = "yes" ]; then
    add_env_var "RESEND_API_KEY" \
        "API key for sending emails" \
        "1. Resend Dashboard → API Keys
2. Click 'Create API Key'
3. Name: 'Hoostn Production'
4. Permission: Full Access
5. Copy the key (starts with 're_...')" \
        "yes" \
        "re_123456789..."

    add_env_var "RESEND_FROM_EMAIL" \
        "Sender email address" \
        "1. Use: noreply@hoostn.com
2. Or: noreply@yourdomain.com
3. You'll need to verify domain in Resend
4. Go to: Domains → Add Domain" \
        "no" \
        "noreply@hoostn.com"
fi

# ============================================
# CATEGORY 4: AI Services (Required)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 4: AI Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "AI powers the automated chat system for guest communication."
echo ""
read -p "Ready to add AI keys? (yes/skip): " ai_ready

if [ "$ai_ready" = "yes" ]; then
    add_env_var "GEMINI_API_KEY" \
        "Google Gemini API key (primary AI provider)" \
        "1. Go to: https://aistudio.google.com/app/apikey
2. Click 'Create API Key'
3. Select existing project or create new
4. Copy the key (starts with 'AIzaSy...')" \
        "yes" \
        "AIzaSyA..."

    add_env_var "OPENROUTER_API_KEY" \
        "OpenRouter API key (fallback AI provider)" \
        "1. Go to: https://openrouter.ai/keys
2. Sign in with Google/GitHub
3. Click 'Create Key'
4. Copy the key (starts with 'sk-or-v1-...')" \
        "yes" \
        "sk-or-v1-..."
fi

# ============================================
# CATEGORY 5: Application URLs (Required)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 5: Application URLs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "These are your production domain URLs."
echo ""
read -p "What is your production domain? (default: hoostn.com): " domain
domain=${domain:-hoostn.com}

echo "https://$domain" | vercel env add NEXT_PUBLIC_APP_URL production --force &>/dev/null
echo -e "${GREEN}✓ Added NEXT_PUBLIC_APP_URL${NC}"

echo "https://$domain/api" | vercel env add NEXT_PUBLIC_API_URL production --force &>/dev/null
echo -e "${GREEN}✓ Added NEXT_PUBLIC_API_URL${NC}"

echo "https://$domain" | vercel env add NEXT_PUBLIC_SITE_URL production --force &>/dev/null
echo -e "${GREEN}✓ Added NEXT_PUBLIC_SITE_URL${NC}"

# ============================================
# CATEGORY 6: Security (Required)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 6: Security${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Generating CRON_SECRET..."
CRON_SECRET=$(openssl rand -base64 32)
echo "$CRON_SECRET" | vercel env add CRON_SECRET production --force &>/dev/null
echo -e "${GREEN}✓ Added CRON_SECRET (generated)${NC}"
echo ""
echo "Save this for webhook configuration:"
echo "CRON_SECRET=$CRON_SECRET"
echo ""

# ============================================
# CATEGORY 7: Environment (Required)
# ============================================
echo "production" | vercel env add NODE_ENV production --force &>/dev/null
echo -e "${GREEN}✓ Added NODE_ENV=production${NC}"

# ============================================
# CATEGORY 8: Optional Services
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Category 7: Optional Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "These are optional and can be added later."
echo ""
read -p "Add optional services now? (yes/skip): " optional_ready

if [ "$optional_ready" = "yes" ]; then
    # Twilio
    echo ""
    echo "SMS notifications (Twilio):"
    read -p "Add Twilio? (yes/skip): " twilio_ready
    if [ "$twilio_ready" = "yes" ]; then
        add_env_var "TWILIO_ACCOUNT_SID" \
            "Twilio account identifier" \
            "1. Go to: https://console.twilio.com
2. Copy 'Account SID' from dashboard" \
            "no" \
            "AC1234567890abcdef..."

        add_env_var "TWILIO_AUTH_TOKEN" \
            "Twilio authentication token" \
            "1. Same dashboard
2. Copy 'Auth Token'" \
            "yes" \
            "your_auth_token"

        add_env_var "TWILIO_PHONE_NUMBER" \
            "Your Twilio phone number" \
            "1. Go to: Phone Numbers → Manage → Active Numbers
2. Copy your phone number with country code" \
            "no" \
            "+33123456789"
    fi

    # Booking.com
    echo ""
    echo "Booking.com OTA integration:"
    read -p "Add Booking.com API? (yes/skip): " booking_ready
    if [ "$booking_ready" = "yes" ]; then
        add_env_var "BOOKING_API_KEY" \
            "Booking.com API key" \
            "1. Go to: https://connect.booking.com
2. Register for API access
3. Copy API key" \
            "yes" \
            "your_booking_api_key"

        add_env_var "BOOKING_API_SECRET" \
            "Booking.com API secret" \
            "1. Same page
2. Copy API secret" \
            "yes" \
            "your_booking_api_secret"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Interactive setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
