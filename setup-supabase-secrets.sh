#!/bin/bash

# Hoostn.com - Supabase Production Setup
# This script helps you configure Supabase for production

set -e

echo "🗄️  Hoostn.com - Supabase Production Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}This script will help you:${NC}"
echo "  1. Create a production Supabase project"
echo "  2. Configure authentication providers"
echo "  3. Set up storage buckets"
echo "  4. Enable required extensions"
echo "  5. Configure security settings"
echo ""
read -p "Ready to begin? (yes/no): " ready

if [ "$ready" != "yes" ]; then
    exit 0
fi

# ============================================
# STEP 1: Create Production Project
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Create Production Project${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Fill in details:"
echo "   - Name: hoostn-production"
echo "   - Database Password: Generate strong password (save it!)"
echo "   - Region: Choose closest to your users"
echo "     • Europe: eu-west-1 (Ireland), eu-central-1 (Frankfurt)"
echo "     • US: us-east-1 (Virginia), us-west-1 (California)"
echo "     • Asia: ap-southeast-1 (Singapore), ap-northeast-1 (Tokyo)"
echo "4. Click 'Create New Project'"
echo "5. Wait ~2 minutes for setup to complete"
echo ""
read -p "Have you created the project? (yes/no): " project_created

if [ "$project_created" != "yes" ]; then
    echo -e "${YELLOW}Please create the project first, then run this script again.${NC}"
    exit 0
fi

# Get project details
echo ""
read -p "Enter your project reference ID (from Settings → General): " project_ref
read -p "Enter your database password (you created this): " -s db_password
echo ""

echo -e "${GREEN}✓ Project created${NC}"

# ============================================
# STEP 2: Authentication Configuration
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Configure Authentication${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Configure in Supabase Dashboard → Authentication → Providers:"
echo ""

echo -e "${YELLOW}Email Authentication (already enabled by default)${NC}"
echo "  ✓ Enable email confirmations"
echo "  ✓ Enable email change confirmations"
echo ""

echo -e "${YELLOW}Magic Link (recommended)${NC}"
echo "  1. Go to: Authentication → Providers → Email"
echo "  2. Enable 'Email Magic Link'"
echo "  3. Save"
echo ""

echo -e "${YELLOW}OAuth Providers (optional)${NC}"
echo "  - Google: Good for international users"
echo "  - GitHub: Good for developer audience"
echo "  - Facebook: Good for consumer audience"
echo ""
echo "To enable OAuth:"
echo "  1. Go to: Authentication → Providers"
echo "  2. Click on provider (e.g., Google)"
echo "  3. Enable it"
echo "  4. Add Client ID and Client Secret from provider"
echo ""
read -p "Have you configured authentication? (yes/skip): " auth_done

# ============================================
# STEP 3: Storage Buckets
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Create Storage Buckets${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Go to: Storage → New Bucket"
echo ""
echo "Create these buckets:"
echo ""
echo "  1. ${BOLD}property-images${NC}"
echo "     - Public: Yes"
echo "     - File size limit: 5 MB"
echo "     - Allowed MIME types: image/jpeg, image/png, image/webp"
echo ""
echo "  2. ${BOLD}lot-images${NC}"
echo "     - Public: Yes"
echo "     - File size limit: 5 MB"
echo "     - Allowed MIME types: image/jpeg, image/png, image/webp"
echo ""
echo "  3. ${BOLD}user-avatars${NC}"
echo "     - Public: Yes"
echo "     - File size limit: 2 MB"
echo "     - Allowed MIME types: image/jpeg, image/png, image/webp"
echo ""
echo "  4. ${BOLD}documents${NC}"
echo "     - Public: No"
echo "     - File size limit: 10 MB"
echo "     - Allowed MIME types: application/pdf, image/*"
echo ""

echo "For each bucket:"
echo "  1. Click 'New Bucket'"
echo "  2. Enter name"
echo "  3. Set 'Public bucket' (yes/no)"
echo "  4. Click 'Create Bucket'"
echo "  5. Click bucket → Policies → New Policy"
echo "  6. Use template or custom SQL for access control"
echo ""
read -p "Have you created storage buckets? (yes/skip): " storage_done

# ============================================
# STEP 4: Database Extensions
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Enable Database Extensions${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Go to: Database → Extensions"
echo ""
echo "Enable these extensions:"
echo ""
echo "  1. ${BOLD}postgis${NC} - Geospatial queries (property locations)"
echo "  2. ${BOLD}pg_stat_statements${NC} - Query performance monitoring"
echo "  3. ${BOLD}uuid-ossp${NC} - UUID generation (usually enabled)"
echo ""
echo "For each:"
echo "  1. Search for extension name"
echo "  2. Toggle ON"
echo ""
echo "Alternative (SQL Editor):"
echo "  CREATE EXTENSION IF NOT EXISTS postgis;"
echo "  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
echo "  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
echo ""
read -p "Have you enabled extensions? (yes/skip): " extensions_done

# ============================================
# STEP 5: Apply Migrations
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 5: Apply Database Migrations${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Now we'll apply all database migrations to production."
echo ""
echo -e "${RED}⚠️  This will modify your production database!${NC}"
echo ""
read -p "Apply migrations now? (yes/later): " apply_migrations

if [ "$apply_migrations" = "yes" ]; then
    echo ""
    echo "Running setup-production-db.sh..."
    ./setup-production-db.sh
else
    echo -e "${YELLOW}Skipped migrations. Run later with: ./setup-production-db.sh${NC}"
fi

# ============================================
# STEP 6: Security Settings
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 6: Security Configuration${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Go to: Settings → API"
echo ""
echo "Configure these settings:"
echo ""
echo "  ${BOLD}1. JWT Settings${NC}"
echo "     - JWT expiry: 3600 (1 hour)"
echo "     - Note: Don't change JWT Secret!"
echo ""
echo "  ${BOLD}2. SMTP Settings (for auth emails)${NC}"
echo "     - Either use Supabase default SMTP"
echo "     - Or configure custom SMTP (Resend, SendGrid)"
echo ""
echo "  ${BOLD}3. Site URL${NC}"
echo "     - Production URL: https://hoostn.com"
echo "     - Redirect URLs: https://hoostn.com/**"
echo ""
echo "  ${BOLD}4. Rate Limiting${NC}"
echo "     - Enable rate limiting"
echo "     - Email sending rate: 4 per hour"
echo ""
read -p "Have you configured security settings? (yes/skip): " security_done

# ============================================
# STEP 7: Get API Keys
# ============================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 7: Copy API Keys${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Go to: Settings → API"
echo ""
echo "You'll need these 3 values for Vercel:"
echo ""
echo "  1. ${BOLD}Project URL${NC}"
echo "     - Copy from: 'Project URL'"
echo "     - Format: https://xxxxxxxxxxxx.supabase.co"
echo ""
echo "  2. ${BOLD}anon/public key${NC}"
echo "     - Copy from: 'Project API keys' → 'anon public'"
echo "     - Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "     - Safe to use client-side"
echo ""
echo "  3. ${BOLD}service_role key${NC}"
echo "     - Copy from: 'Project API keys' → 'service_role'"
echo "     - Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "     - ⚠️  KEEP SECRET! Server-side only!"
echo ""

echo "Save these values - you'll add them to Vercel next."
echo ""

# Create a summary file
SUMMARY_FILE="supabase-production-summary.txt"
cat > "$SUMMARY_FILE" <<EOF
Hoostn.com - Supabase Production Summary
Generated: $(date)

Project Reference: $project_ref

API Endpoints:
--------------
Go to: Settings → API to get these values

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (copy anon public key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (copy service_role key)

Database Connection:
-------------------
Host: db.YOUR-PROJECT-REF.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [your database password]

Important URLs:
--------------
Dashboard: https://supabase.com/dashboard/project/$project_ref
Database: https://supabase.com/dashboard/project/$project_ref/editor
Auth: https://supabase.com/dashboard/project/$project_ref/auth
Storage: https://supabase.com/dashboard/project/$project_ref/storage
API Docs: https://supabase.com/dashboard/project/$project_ref/api

Next Steps:
----------
1. Add API keys to Vercel (run: ./setup-vercel-secrets.sh)
2. Apply database migrations (run: ./setup-production-db.sh)
3. Test connection from local environment
4. Deploy application to Vercel

Security Checklist:
------------------
[ ] Row Level Security (RLS) enabled on all tables
[ ] Storage policies configured
[ ] Auth email templates customized
[ ] Rate limiting enabled
[ ] Database backups configured
[ ] SSL enforced on database connections
EOF

echo -e "${GREEN}✓ Summary saved to: $SUMMARY_FILE${NC}"
echo ""

# ============================================
# COMPLETION
# ============================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Supabase production setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Review: $SUMMARY_FILE"
echo "  2. Copy your 3 API keys from Supabase Dashboard"
echo "  3. Add them to Vercel: ./setup-vercel-secrets.sh"
echo "  4. Apply migrations: ./setup-production-db.sh"
echo "  5. Deploy app: ./deploy-to-vercel.sh"
echo ""
echo "Useful commands:"
echo "  - Test connection: npx supabase db ping"
echo "  - View tables: npx supabase db dump --data-only"
echo "  - Create backup: npx supabase db dump > backup.sql"
echo ""
