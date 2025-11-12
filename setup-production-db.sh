#!/bin/bash

# Hoostn.com - Production Database Setup Script
# This script applies all migrations to production Supabase

set -e

echo "🗄️  Hoostn.com - Production Database Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Warning
echo -e "${RED}⚠️  WARNING: This will modify your PRODUCTION database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi
echo ""

# Step 1: Check Supabase CLI
echo -e "${BLUE}Step 1: Checking Supabase CLI...${NC}"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI available${NC}"
echo ""

# Step 2: Login to Supabase
echo -e "${BLUE}Step 2: Logging in to Supabase...${NC}"
echo "You'll need to authenticate with Supabase."
npx supabase login
echo ""

# Step 3: Get production project reference
echo -e "${BLUE}Step 3: Enter your production Supabase project reference${NC}"
echo "Find it in: Supabase Dashboard → Settings → General → Reference ID"
echo ""
read -p "Production project reference: " project_ref

if [ -z "$project_ref" ]; then
    echo -e "${RED}Error: Project reference is required${NC}"
    exit 1
fi
echo ""

# Step 4: Link to production
echo -e "${BLUE}Step 4: Linking to production project...${NC}"
npx supabase link --project-ref "$project_ref"
echo -e "${GREEN}✓ Linked to production project${NC}"
echo ""

# Step 5: Review pending migrations
echo -e "${BLUE}Step 5: Reviewing pending migrations...${NC}"
echo ""
echo "Migrations to be applied:"
echo ""
ls -1 supabase/migrations/*.sql | nl
echo ""

# List migration files with descriptions
echo "Migration details:"
echo ""
echo "  1. 20250112000017_ota_connections.sql - OTA connections table"
echo "  2. 20250112000018_ota_sync_logs.sql - Sync audit logs"
echo "  3. 20250112000019_reservations_ota_fields.sql - Reservation enhancements"
echo "  4. 20250112000020_ota_conflicts.sql - Conflict tracking"
echo "  5. 20250113000001_stripe_connect_schema.sql - Stripe Connect tables (7 tables)"
echo "  6. 20250113000002_stripe_connect_updates.sql - Additional Stripe fields"
echo "  7. 20250113000003_chat_enhancements.sql - AI chat enhancements"
echo ""

read -p "Apply all migrations? (yes/no): " apply_confirm
if [ "$apply_confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi
echo ""

# Step 6: Create backup recommendation
echo -e "${YELLOW}📋 Backup Recommendation${NC}"
echo "Before applying migrations, it's recommended to create a backup."
echo ""
echo "Options:"
echo "  1. Manual backup: npx supabase db dump -f backup_$(date +%Y%m%d).sql"
echo "  2. Use Supabase Dashboard → Settings → Database → Backups"
echo ""
read -p "Have you created a backup? (yes/skip): " backup_confirm
echo ""

# Step 7: Apply migrations
echo -e "${BLUE}Step 6: Applying migrations to production...${NC}"
echo ""
npx supabase db push

echo ""
echo -e "${GREEN}✓ Migrations applied successfully!${NC}"
echo ""

# Step 8: Verify migrations
echo -e "${BLUE}Step 7: Verifying migrations...${NC}"
npx supabase db diff

echo ""
echo -e "${GREEN}✓ Database setup complete!${NC}"
echo ""

# Step 9: Seed data reminder
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Seed default data (optional):"
echo "   - Open Supabase SQL Editor"
echo "   - Run: supabase/seed/production-seed.sql"
echo ""
echo "2. Verify tables in Supabase Dashboard:"
echo "   - ota_connections"
echo "   - ota_sync_logs"
echo "   - ota_conflicts"
echo "   - stripe_connected_accounts"
echo "   - payment_intents"
echo "   - payment_splits"
echo "   - refunds"
echo "   - platform_fees"
echo "   - stripe_webhooks"
echo "   - payout_transactions"
echo ""
echo "3. Enable required extensions (if not done):"
echo "   - CREATE EXTENSION IF NOT EXISTS postgis;"
echo "   - CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
echo ""
echo "4. Verify RLS policies are enabled on all tables"
echo ""
echo -e "${GREEN}🎉 Production database is ready!${NC}"
