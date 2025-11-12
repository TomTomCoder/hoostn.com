# OTA iCal Synchronization Integration

Complete implementation of OTA (Online Travel Agency) iCal synchronization for Hoostn.com, enabling automatic import of Airbnb reservations with conflict detection.

## Overview

This integration provides:
- ✅ Airbnb iCal import (one-way sync)
- ✅ Automatic synchronization every 30-60 minutes
- ✅ Conflict detection for double bookings
- ✅ Manual sync trigger
- ✅ iCal export for lot calendars
- ✅ Comprehensive error handling
- ✅ Audit logging

## Architecture

### Database Schema

**ota_connections** - Stores OTA platform connections
- Tracks sync frequency, status, and configuration
- Unique constraint: one connection per lot+platform
- Auto-pauses after 5 consecutive errors

**ota_sync_logs** - Audit trail of sync operations
- Records items processed, created, updated, failed
- Tracks sync duration and errors
- Filterable by connection, status, date

**ota_conflicts** - Booking conflicts requiring resolution
- Double bookings, date overlaps, cancellations
- Severity levels: low, medium, high, critical
- Manual resolution workflow

**reservations** (enhanced) - Added OTA fields
- `ota_connection_id` - Link to source connection
- `ota_booking_id` - Unique OTA booking identifier (for deduplication)
- `ota_sync_status` - Current sync status
- `ota_metadata` - Platform-specific data

### Core Components

**iCal Parser** (`/lib/ota/ical/parser.ts`)
- RFC 5545 compliant parsing
- Handles line folding, escape sequences
- Timezone support
- HTTPS-only for security

**iCal Generator** (`/lib/ota/ical/generator.ts`)
- Generates standard iCal feeds
- Exports confirmed/pending reservations
- Proper line folding (75 char limit)

**Airbnb Sync** (`/lib/ota/sync/airbnb-sync.ts`)
- Fetches and parses iCal events
- Creates/updates reservations
- Detects conflicts before importing
- Idempotent using `ota_booking_id`
- Limits to 100 events per sync

**Conflict Resolver** (`/lib/ota/sync/conflict-resolver.ts`)
- Date overlap detection
- Conflict type determination
- Resolution workflow support

## Setup Instructions

### 1. Database Migration

Apply migrations in order:
```bash
cd supabase/migrations
# Files will auto-apply on next Supabase push:
# 20250112000017_ota_connections.sql
# 20250112000018_ota_sync_logs.sql
# 20250112000019_reservations_ota_fields.sql
# 20250112000020_ota_conflicts.sql
```

### 2. Environment Variables

Add to `.env.local` and Vercel:
```bash
CRON_SECRET=<generate-random-32-char-string>
```

Generate secret:
```bash
openssl rand -base64 32
```

### 3. Vercel Cron Job

The cron job is configured in `vercel.json`:
- Runs every 30 minutes: `*/30 * * * *`
- Endpoint: `/api/cron/ota-sync`
- Secured with Bearer token

**Deployment:**
1. Deploy to Vercel
2. Go to Project Settings → Environment Variables
3. Add `CRON_SECRET` with your generated value
4. Redeploy

**Verification:**
```bash
# Check cron logs in Vercel Dashboard
# Or test manually:
curl -X GET https://your-domain.com/api/cron/ota-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 4. Test iCal Export

Each lot gets an iCal feed:
```
https://your-domain.com/api/ota/ical/[lot-id]
```

Test with:
```bash
curl https://your-domain.com/api/ota/ical/[lot-id]
```

Should return valid iCalendar format.

## User Guide

### Adding an Airbnb Connection

1. **Get iCal URL from Airbnb:**
   - Log in to Airbnb hosting account
   - Go to Calendar → Availability settings
   - Scroll to "Sync calendars"
   - Copy "Export calendar" URL

2. **Add Connection in Hoostn:**
   - Navigate to Dashboard → OTA Integrations
   - Click "Add Connection"
   - Select the lot
   - Choose "Airbnb (iCal)"
   - Paste iCal URL
   - Set sync frequency (default: 30 minutes)
   - Click "Create Connection"

3. **First Sync:**
   - Click "Sync Now" to test immediately
   - Check "Recent Sync Activity" for results

### Managing Conflicts

When a conflict is detected:
1. Go to Dashboard → OTA Integrations
2. View "Unresolved Conflicts" section
3. Review conflict details:
   - Local reservation vs Remote booking
   - Dates, guest names, prices
4. Choose resolution:
   - **Keep Local** - Ignore remote booking
   - **Keep Remote** - Cancel local, accept remote
   - **Manual Merge** - Handle manually
   - **Ignore** - Dismiss conflict

### Manual Sync

Trigger sync anytime:
- Dashboard → OTA Integrations
- Find connection
- Click "Sync Now"
- View results immediately

## API Reference

### Cron Endpoint

**GET** `/api/cron/ota-sync`

Headers:
```
Authorization: Bearer {CRON_SECRET}
```

Response:
```json
{
  "success": true,
  "synced": 5,
  "successful": 4,
  "failed": 1,
  "results": [...]
}
```

### iCal Export

**GET** `/api/ota/ical/{lotId}`

Public endpoint - no auth required.

Returns: `text/calendar` format

### Server Actions

**getOTAConnections()** - List all connections
**createOTAConnection(input)** - Add new connection
**updateOTAConnection(id, input)** - Update connection
**deleteOTAConnection(id)** - Remove connection
**triggerManualSync(connectionId)** - Start sync
**getSyncLogs(connectionId?, limit?)** - View logs
**getConflicts(status?)** - List conflicts
**resolveConflict(id, action)** - Resolve conflict

## Technical Details

### Sync Process

1. **Fetch connections** due for sync (next_sync_at <= now)
2. **For each connection:**
   - Fetch iCal feed from URL
   - Parse VEVENT components
   - Filter out past bookings
   - Check for existing reservations by ota_booking_id
3. **For each event:**
   - **New booking:**
     - Check for date conflicts
     - If conflict: log to ota_conflicts table
     - If no conflict: create reservation
   - **Existing booking:**
     - Detect date changes
     - Check if new dates conflict
     - Update if safe, log conflict if not
     - Handle cancellations (STATUS=CANCELLED)
4. **Update sync status:**
   - Set last_sync_at, next_sync_at
   - Reset error_count on success
   - Increment error_count on failure
   - Auto-pause after 5 errors

### Conflict Detection

Date overlap logic:
```sql
WHERE check_in < new_checkout
  AND check_out > new_checkin
  AND status IN ('confirmed', 'checked_in', 'pending')
```

### Idempotency

Prevents duplicate imports:
- Unique index: `(ota_connection_id, ota_booking_id)`
- Upsert logic based on ota_booking_id (iCal UID)

### Error Handling

- Invalid URLs rejected (HTTPS only)
- Network timeouts (30 seconds)
- Parse errors logged
- Auto-pause after 5 consecutive failures
- Detailed error messages in sync logs

## Limitations & Known Issues

1. **iCal Import Only:**
   - Cannot export back to Airbnb
   - Changes in Hoostn won't block Airbnb calendar
   - Consider two-way API integration

2. **Limited Guest Data:**
   - iCal doesn't provide real guest email
   - Uses placeholder: guest@airbnb.com
   - Guest count defaults to 1
   - No pricing information

3. **Sync Frequency:**
   - Minimum 30 minutes (Vercel cron limit)
   - Not real-time
   - Last-minute bookings may not sync immediately

4. **Conflict Resolution:**
   - Must be resolved manually
   - No automatic preference rules
   - Both systems must be updated separately

## Next Steps (Phase 2)

### Booking.com API Integration
- Two-way synchronization
- Real-time webhooks
- Guest data access
- Pricing synchronization
- Automatic conflict resolution rules

### Enhanced Features
- Multi-platform conflict detection (Airbnb vs Booking.com)
- Rate parity monitoring
- Availability sync (block dates on all platforms)
- Automated messages to guests
- Revenue analytics by channel

## Troubleshooting

### Connection shows "Error" status

1. Check error message on connection card
2. Verify iCal URL is still valid
3. Test URL in browser (should download .ics file)
4. Check Airbnb hasn't changed calendar settings
5. Manual sync to retry

### Sync not creating reservations

1. Check sync logs for errors
2. Verify dates are in the future
3. Check for existing conflicts
4. Ensure lot is active
5. Verify org_id matches

### Cron job not running

1. Check Vercel Dashboard → Cron Jobs
2. Verify CRON_SECRET is set
3. Check API route logs
4. Test endpoint manually with curl

### iCal export returns 404

1. Verify lot ID is correct
2. Check lot status is "active"
3. Ensure lot exists in database

## Security Considerations

- HTTPS-only iCal URLs
- Cron secret validation
- RLS policies on all tables
- No sensitive data in iCal exports
- Org isolation for all queries

## Performance

- Batch processing (50 connections per cron run)
- Limit 100 events per sync
- Indexed queries for conflict detection
- Efficient date range queries
- Async sync operations

## Support

For issues or questions:
1. Check sync logs in dashboard
2. Review conflict details
3. Test iCal URL manually
4. Check Vercel function logs
5. Verify environment variables

---

**Implementation Date:** 2025-01-12
**Version:** 1.0.0
**Status:** Production Ready ✅
