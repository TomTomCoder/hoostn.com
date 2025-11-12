# 🔨 Hoostn Development Phases - Detailed Task Breakdown

**For Development with Claude Code**
**Version:** 1.0
**Last Updated:** November 12, 2025

---

## 📖 How to Use This Document

This document provides **granular, actionable tasks** for each development phase. Each task is designed to be:
- ✅ **Completable in 2-4 hours** (optimal for Claude Code sessions)
- ✅ **Testable** (clear success criteria)
- ✅ **Independent** (minimal blocking dependencies)
- ✅ **Incremental** (builds upon previous work)

---

## 🎯 PHASE 1: MVP Foundation (80 days)

### **Sprint 1: Authentication System** (Weeks 1-2)

#### Task 1.1: Supabase Auth Configuration
**Duration:** 2-3 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Configure Supabase Auth in `supabase/config.toml`
- [ ] Add auth redirect URLs to config
- [ ] Enable magic link authentication
- [ ] Set JWT expiry to 1 hour
- [ ] Test auth configuration locally

**Files to Create/Modify:**
- `supabase/config.toml` (update)
- `.env.example` (add auth vars)

**Success Criteria:**
- Magic link emails sent successfully
- JWT tokens generated correctly
- Session persists across page refreshes

---

#### Task 1.2: Sign Up Page
**Duration:** 3-4 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `apps/web/app/(auth)/signup/page.tsx`
- [ ] Add email input form
- [ ] Add organization name input
- [ ] Implement form validation (Zod)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Style with Tailwind (Hoostn brand)
- [ ] Make responsive (mobile + desktop)

**Files to Create:**
- `apps/web/app/(auth)/signup/page.tsx`
- `apps/web/app/(auth)/layout.tsx`
- `apps/web/lib/validations/auth.ts`

**Success Criteria:**
- Form validates correctly
- Magic link sent on submit
- Error messages display properly
- Works on mobile and desktop

---

#### Task 1.3: Login Page
**Duration:** 2-3 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `apps/web/app/(auth)/login/page.tsx`
- [ ] Add email input form
- [ ] Implement form validation
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add "Sign up" link
- [ ] Style consistently with signup

**Files to Create:**
- `apps/web/app/(auth)/login/page.tsx`

**Success Criteria:**
- Existing users can request login link
- Link redirects to dashboard
- Error for non-existent users

---

#### Task 1.4: Email Verification Flow
**Duration:** 2-3 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create callback route `app/(auth)/auth/callback/route.ts`
- [ ] Extract token from URL
- [ ] Verify token with Supabase
- [ ] Create user record in `users` table
- [ ] Create organization record
- [ ] Redirect to dashboard
- [ ] Handle errors (expired token, etc.)

**Files to Create:**
- `apps/web/app/(auth)/auth/callback/route.ts`

**Success Criteria:**
- Token verification works
- User created in database
- Organization created
- Redirects correctly

---

#### Task 1.5: Dashboard Layout & Protected Routes
**Duration:** 3-4 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `apps/web/app/(dashboard)/layout.tsx`
- [ ] Add sidebar navigation
- [ ] Add top navigation bar
- [ ] Add user menu (logout, profile)
- [ ] Implement auth check in middleware
- [ ] Redirect unauthenticated users to login
- [ ] Add loading skeleton

**Files to Create:**
- `apps/web/app/(dashboard)/layout.tsx`
- `apps/web/components/dashboard/sidebar.tsx`
- `apps/web/components/dashboard/navbar.tsx`

**Success Criteria:**
- Layout renders correctly
- Sidebar navigation works
- Unauthenticated users redirected
- Logout functionality works

---

#### Task 1.6: User Profile Management
**Duration:** 3-4 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Create profile page `app/(dashboard)/profile/page.tsx`
- [ ] Display current user info
- [ ] Add edit form (name, avatar)
- [ ] Implement avatar upload (Supabase Storage)
- [ ] Update user record
- [ ] Add success/error messages

**Files to Create:**
- `apps/web/app/(dashboard)/profile/page.tsx`
- `apps/web/lib/storage/avatars.ts`

**Success Criteria:**
- User can view profile
- User can update name
- User can upload avatar
- Changes persist

---

### **Sprint 2: Property Management** (Weeks 3-4)

#### Task 2.1: Properties List Page
**Duration:** 3-4 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `app/(dashboard)/properties/page.tsx`
- [ ] Fetch properties for current org
- [ ] Display in grid/list view
- [ ] Add "New Property" button
- [ ] Add empty state
- [ ] Add loading state
- [ ] Add search/filter

**Files to Create:**
- `apps/web/app/(dashboard)/properties/page.tsx`
- `apps/web/lib/queries/properties.ts`

**Success Criteria:**
- Properties display correctly
- RLS working (only org properties shown)
- Empty state shows for new users
- Search works

---

#### Task 2.2: Add Property Form
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `app/(dashboard)/properties/new/page.tsx`
- [ ] Build multi-step form:
  - Step 1: Basic info (name, description)
  - Step 2: Address & location
  - Step 3: Contact info
- [ ] Add form validation (Zod schema)
- [ ] Implement geocoding (address → coordinates)
- [ ] Add image upload (multiple)
- [ ] Save to database
- [ ] Redirect to property details

**Files to Create:**
- `apps/web/app/(dashboard)/properties/new/page.tsx`
- `apps/web/components/properties/property-form.tsx`
- `apps/web/lib/validations/property.ts`
- `apps/web/lib/geocoding.ts`

**Success Criteria:**
- Form submits successfully
- Images upload to Supabase Storage
- Geocoding converts address to coords
- Property created in database

---

#### Task 2.3: Property Details Page
**Duration:** 3-4 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `app/(dashboard)/properties/[id]/page.tsx`
- [ ] Display property information
- [ ] Show property images (gallery)
- [ ] Display location on map
- [ ] Add "Edit" button
- [ ] Add "Delete" button (with confirmation)
- [ ] Show associated lots

**Files to Create:**
- `apps/web/app/(dashboard)/properties/[id]/page.tsx`
- `apps/web/components/properties/property-details.tsx`
- `apps/web/components/properties/image-gallery.tsx`

**Success Criteria:**
- Property details display correctly
- Images show in gallery
- Map shows correct location
- Edit and delete work

---

#### Task 2.4: Edit Property Form
**Duration:** 3 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `app/(dashboard)/properties/[id]/edit/page.tsx`
- [ ] Pre-fill form with existing data
- [ ] Allow updating all fields
- [ ] Handle image updates (add/remove)
- [ ] Update database
- [ ] Show success message

**Files to Create:**
- `apps/web/app/(dashboard)/properties/[id]/edit/page.tsx`

**Success Criteria:**
- Form pre-fills correctly
- Updates save successfully
- Images can be added/removed
- Redirects after save

---

#### Task 2.5: Lots Management (Add/Edit)
**Duration:** 5-6 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create lot form component
- [ ] Add fields: title, description, bedrooms, bathrooms, max_guests
- [ ] Add amenities checkboxes
- [ ] Add pricing fields (base_price, cleaning_fee, tourist_tax)
- [ ] Add pets_allowed toggle
- [ ] Add lot images upload
- [ ] Implement lot CRUD operations
- [ ] Link lots to property

**Files to Create:**
- `apps/web/components/lots/lot-form.tsx`
- `apps/web/app/(dashboard)/properties/[id]/lots/new/page.tsx`
- `apps/web/app/(dashboard)/properties/[id]/lots/[lotId]/edit/page.tsx`
- `apps/web/lib/validations/lot.ts`

**Success Criteria:**
- Lot can be created
- Lot can be edited
- Lot can be deleted
- Images upload successfully
- Linked to correct property

---

### **Sprint 3: Calendar & Availability** (Weeks 5-6)

#### Task 3.1: Calendar UI Component
**Duration:** 6-8 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Install calendar library (react-day-picker or build custom)
- [ ] Create calendar component
- [ ] Display month view
- [ ] Add navigation (prev/next month)
- [ ] Style with Hoostn brand colors
- [ ] Add legend (available, booked, blocked)
- [ ] Make responsive

**Files to Create:**
- `apps/web/components/calendar/calendar.tsx`
- `apps/web/components/calendar/calendar-day.tsx`
- `apps/web/components/calendar/calendar-legend.tsx`

**Success Criteria:**
- Calendar renders correctly
- Month navigation works
- Responsive on mobile
- Visually matches brand

---

#### Task 3.2: Availability Management
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create availability table migration
- [ ] Add date blocking functionality
- [ ] Add date unblocking functionality
- [ ] Add date range selection
- [ ] Add block reason (maintenance, personal)
- [ ] Show blocked dates on calendar
- [ ] Add API routes for availability

**Files to Create:**
- `supabase/migrations/[timestamp]_add_availability.sql`
- `apps/web/app/api/lots/[id]/availability/route.ts`
- `apps/web/lib/queries/availability.ts`

**Success Criteria:**
- Dates can be blocked
- Dates can be unblocked
- Blocked dates show on calendar
- RLS enforced

---

#### Task 3.3: Pricing Calendar
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create pricing table migration
- [ ] Add price-per-date functionality
- [ ] Add seasonal pricing
- [ ] Add minimum stay rules
- [ ] Create pricing UI overlay on calendar
- [ ] Add bulk pricing (date range)
- [ ] Add API routes

**Files to Create:**
- `supabase/migrations/[timestamp]_add_pricing.sql`
- `apps/web/app/api/lots/[id]/pricing/route.ts`
- `apps/web/components/calendar/pricing-modal.tsx`

**Success Criteria:**
- Prices can be set per date
- Seasonal pricing works
- Min stay enforced
- Displays on calendar

---

#### Task 3.4: Multi-Lot Calendar View
**Duration:** 3-4 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Create multi-lot calendar page
- [ ] Display multiple lots side-by-side
- [ ] Sync date navigation across lots
- [ ] Add lot selector
- [ ] Show bookings for all lots
- [ ] Add responsive table view for mobile

**Files to Create:**
- `apps/web/app/(dashboard)/calendar/page.tsx`
- `apps/web/components/calendar/multi-lot-calendar.tsx`

**Success Criteria:**
- Multiple lots display
- Navigation synced
- Bookings visible
- Works on mobile

---

### **Sprint 4: Booking Engine** (Weeks 7-9)

#### Task 4.1: Public Search Page
**Duration:** 5-6 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `app/(public)/search/page.tsx`
- [ ] Add search form (city, dates, guests)
- [ ] Add filters sidebar (price, bedrooms, amenities, pets)
- [ ] Fetch available lots (API route)
- [ ] Display results in grid
- [ ] Add sorting (price, rating)
- [ ] Add pagination
- [ ] Add empty state

**Files to Create:**
- `apps/web/app/(public)/search/page.tsx`
- `apps/web/app/api/search/route.ts`
- `apps/web/components/search/search-form.tsx`
- `apps/web/components/search/filters.tsx`
- `apps/web/components/search/lot-card.tsx`

**Success Criteria:**
- Search returns available lots
- Filters work correctly
- Results paginated
- Performance acceptable (<2s)

---

#### Task 4.2: Lot Detail Page (Public)
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create `app/(public)/lots/[id]/page.tsx`
- [ ] Display lot information
- [ ] Show image gallery
- [ ] Display amenities list
- [ ] Show pricing info
- [ ] Add reviews section (placeholder)
- [ ] Add "Book Now" CTA
- [ ] Add map with location

**Files to Create:**
- `apps/web/app/(public)/lots/[id]/page.tsx`
- `apps/web/components/lots/lot-detail-public.tsx`

**Success Criteria:**
- Lot details display
- Images in gallery
- Booking CTA prominent
- SEO optimized

---

#### Task 4.3: Booking Form & Flow
**Duration:** 6-8 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create booking form component
- [ ] Add date selection (check-in/check-out)
- [ ] Add guest count selector
- [ ] Add guest information form
- [ ] Calculate total price dynamically
- [ ] Show price breakdown (nights, cleaning, tax)
- [ ] Add special requests field
- [ ] Validate availability before booking
- [ ] Create pending reservation

**Files to Create:**
- `apps/web/components/booking/booking-form.tsx`
- `apps/web/components/booking/price-breakdown.tsx`
- `apps/web/lib/booking/calculate-price.ts`
- `apps/web/lib/booking/check-availability.ts`

**Success Criteria:**
- Dates can be selected
- Price calculates correctly
- Availability checked
- Guest info collected

---

#### Task 4.4: Booking Confirmation
**Duration:** 3-4 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create confirmation page
- [ ] Display booking summary
- [ ] Show guest information
- [ ] Show price breakdown
- [ ] Add terms & conditions checkbox
- [ ] Proceed to payment button
- [ ] Send confirmation email

**Files to Create:**
- `apps/web/app/(public)/booking/[id]/confirm/page.tsx`
- `apps/web/lib/email/booking-confirmation.ts`

**Success Criteria:**
- Summary displays correctly
- Email sent successfully
- Proceeds to payment

---

### **Sprint 5: Payment Integration** (Weeks 9-11)

#### Task 5.1: Stripe Connect Onboarding
**Duration:** 6-8 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Install Stripe SDK
- [ ] Create Stripe Connect account link
- [ ] Add onboarding page
- [ ] Handle OAuth return
- [ ] Store Connect account ID
- [ ] Check account status
- [ ] Add re-onboarding for incomplete accounts
- [ ] Add dashboard link to Stripe

**Files to Create:**
- `apps/web/app/(dashboard)/settings/payments/page.tsx`
- `apps/web/app/api/stripe/connect/route.ts`
- `apps/web/app/api/stripe/callback/route.ts`
- `apps/web/lib/stripe/connect.ts`

**Success Criteria:**
- Onboarding link generated
- Account created in Stripe
- Account ID saved
- Status displayed

---

#### Task 5.2: Payment Checkout Page
**Duration:** 5-6 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create checkout page
- [ ] Add Stripe Elements (card input)
- [ ] Create payment intent (API route)
- [ ] Handle payment submission
- [ ] Add 3D Secure support
- [ ] Add loading states
- [ ] Handle payment success
- [ ] Handle payment failure
- [ ] Add error messages

**Files to Create:**
- `apps/web/app/(public)/booking/[id]/checkout/page.tsx`
- `apps/web/app/api/stripe/payment-intent/route.ts`
- `apps/web/components/payment/stripe-checkout.tsx`

**Success Criteria:**
- Card input works
- Payment processes
- 3DS handled
- Success/failure handled

---

#### Task 5.3: Payment Success & Invoice
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create success page
- [ ] Update reservation status
- [ ] Generate invoice (PDF)
- [ ] Send invoice email
- [ ] Display booking details
- [ ] Add "View Invoice" link
- [ ] Add "Go to Dashboard" CTA

**Files to Create:**
- `apps/web/app/(public)/booking/[id]/success/page.tsx`
- `apps/web/lib/invoice/generate-pdf.ts`
- `apps/web/app/api/invoices/[id]/route.ts`

**Success Criteria:**
- Success page shows
- Reservation confirmed
- Invoice generated
- Email sent

---

#### Task 5.4: Stripe Webhooks
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create webhook endpoint
- [ ] Verify webhook signature
- [ ] Handle payment.succeeded
- [ ] Handle payment.failed
- [ ] Handle refund events
- [ ] Update reservation status
- [ ] Log all events
- [ ] Send notifications

**Files to Create:**
- `apps/web/app/api/webhooks/stripe/route.ts`
- `apps/web/lib/stripe/webhooks.ts`

**Success Criteria:**
- Webhooks verified
- Events processed
- Status updated
- Logs created

---

#### Task 5.5: Refund Management
**Duration:** 3-4 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Add refund button (owner dashboard)
- [ ] Calculate refund amount (policy-based)
- [ ] Create Stripe refund
- [ ] Update reservation status
- [ ] Send refund email
- [ ] Log refund transaction

**Files to Create:**
- `apps/web/app/api/reservations/[id]/refund/route.ts`
- `apps/web/lib/stripe/refunds.ts`
- `apps/web/components/reservations/refund-button.tsx`

**Success Criteria:**
- Refunds process
- Amount calculated correctly
- Email sent
- Status updated

---

### **Sprint 6: OTA Synchronization** (Weeks 11-12)

#### Task 6.1: iCal Import (Airbnb)
**Duration:** 5-6 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Add iCal URL field to lots
- [ ] Create iCal parser
- [ ] Fetch iCal data
- [ ] Parse VEVENT entries
- [ ] Create/update reservations
- [ ] Mark as external (channel: airbnb)
- [ ] Create cron job (30 min interval)
- [ ] Add sync status indicator

**Files to Create:**
- `apps/web/lib/ota/ical-parser.ts`
- `apps/web/lib/ota/ical-sync.ts`
- `supabase/functions/sync-ical/index.ts`

**Success Criteria:**
- iCal URL parsed
- Reservations imported
- Cron runs automatically
- No duplicates

---

#### Task 6.2: iCal Export
**Duration:** 3-4 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Generate iCal feed per lot
- [ ] Include all reservations
- [ ] Include blocked dates
- [ ] Create public URL
- [ ] Add "Copy iCal URL" button
- [ ] Test with Airbnb

**Files to Create:**
- `apps/web/app/api/lots/[id]/ical/route.ts`
- `apps/web/lib/ota/ical-generator.ts`

**Success Criteria:**
- iCal feed generated
- Airbnb can import
- Updates reflected

---

#### Task 6.3: Booking.com API Integration
**Duration:** 8-10 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Set up Booking.com API credentials
- [ ] Implement OAuth flow
- [ ] Fetch reservations API
- [ ] Push availability API
- [ ] Push pricing API
- [ ] Handle cancellations
- [ ] Create sync scheduler
- [ ] Add error handling

**Files to Create:**
- `apps/web/lib/ota/booking-api.ts`
- `apps/web/app/api/ota/booking/auth/route.ts`
- `apps/web/app/api/ota/booking/sync/route.ts`

**Success Criteria:**
- OAuth works
- Reservations fetched
- Availability pushed
- Pricing synced

---

#### Task 6.4: Conflict Detection
**Duration:** 4-5 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create conflict detection algorithm
- [ ] Check overlapping dates
- [ ] Prioritize OTA bookings (Rule R1)
- [ ] Block conflicting dates
- [ ] Send alert to owner
- [ ] Add conflict resolution UI
- [ ] Log all conflicts

**Files to Create:**
- `apps/web/lib/booking/conflict-detection.ts`
- `apps/web/app/(dashboard)/conflicts/page.tsx`

**Success Criteria:**
- Conflicts detected
- OTA prioritized
- Alerts sent
- No double-bookings

---

### **Sprint 7: Dashboard & Analytics** (Week 12)

#### Task 7.1: Overview Dashboard
**Duration:** 5-6 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create dashboard page
- [ ] Add KPI cards (revenue, occupancy, bookings)
- [ ] Add upcoming check-ins widget
- [ ] Add upcoming check-outs widget
- [ ] Add recent bookings list
- [ ] Add quick actions
- [ ] Make responsive

**Files to Create:**
- `apps/web/app/(dashboard)/page.tsx`
- `apps/web/components/dashboard/kpi-card.tsx`
- `apps/web/components/dashboard/upcoming-widget.tsx`

**Success Criteria:**
- Dashboard loads quickly (<2s)
- KPIs accurate
- Responsive

---

#### Task 7.2: Revenue Analytics
**Duration:** 4-5 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Add revenue chart (line/bar)
- [ ] Calculate monthly revenue
- [ ] Add year-over-year comparison
- [ ] Add filter by property/lot
- [ ] Add date range selector
- [ ] Show ADR (Average Daily Rate)
- [ ] Show RevPAR (Revenue Per Available Room)

**Files to Create:**
- `apps/web/components/analytics/revenue-chart.tsx`
- `apps/web/lib/analytics/revenue.ts`

**Success Criteria:**
- Charts render
- Calculations correct
- Filters work

---

#### Task 7.3: Occupancy Analytics
**Duration:** 3-4 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Calculate occupancy rate
- [ ] Create occupancy chart
- [ ] Add heatmap calendar view
- [ ] Show by property/lot
- [ ] Add date range filter

**Files to Create:**
- `apps/web/components/analytics/occupancy-chart.tsx`
- `apps/web/lib/analytics/occupancy.ts`

**Success Criteria:**
- Occupancy calculates correctly
- Heatmap displays
- Filters work

---

#### Task 7.4: Export Functionality
**Duration:** 3-4 hours
**Priority:** P1

**Sub-tasks:**
- [ ] Add "Export CSV" button
- [ ] Generate CSV from reservations
- [ ] Add "Export Excel" button
- [ ] Include filters in export
- [ ] Add date range to export
- [ ] Download file

**Files to Create:**
- `apps/web/lib/export/csv.ts`
- `apps/web/lib/export/excel.ts`
- `apps/web/app/api/export/route.ts`

**Success Criteria:**
- CSV exports
- Excel exports
- Data accurate

---

## 🎯 PHASE 2: Automation & Intelligence (90 days)

### **Sprint 8: AI Chat Foundation** (Weeks 13-15)

#### Task 8.1: Chat Database Setup
**Duration:** 3-4 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Verify chat tables exist (threads, messages, ai_traces, handoffs)
- [ ] Create indexes for performance
- [ ] Add RLS policies
- [ ] Test with sample data

**Files to Modify:**
- Already created in initial migration

**Success Criteria:**
- Tables accessible
- RLS working
- Performance acceptable

---

#### Task 8.2: Chat UI Component
**Duration:** 6-8 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Create chat widget component
- [ ] Add message list (scrollable)
- [ ] Add message input
- [ ] Add typing indicator
- [ ] Add online/offline status
- [ ] Style as floating widget
- [ ] Make responsive

**Files to Create:**
- `apps/web/components/chat/chat-widget.tsx`
- `apps/web/components/chat/message.tsx`
- `apps/web/components/chat/message-input.tsx`

**Success Criteria:**
- Widget displays
- Messages render
- Input works

---

#### Task 8.3: Real-time Messaging (Supabase Realtime)
**Duration:** 5-6 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Set up Supabase Realtime channel
- [ ] Subscribe to thread updates
- [ ] Handle new message events
- [ ] Handle message updates
- [ ] Handle presence (typing)
- [ ] Add optimistic updates

**Files to Create:**
- `apps/web/lib/chat/realtime.ts`
- `apps/web/hooks/use-chat-subscription.ts`

**Success Criteria:**
- Messages appear instantly
- Typing indicator works
- No message loss

---

#### Task 8.4: AI Integration (OpenRouter/Gemini)
**Duration:** 8-10 hours
**Priority:** P0

**Sub-tasks:**
- [ ] Set up OpenRouter API client
- [ ] Create AI context builder (lot + reservation + history)
- [ ] Implement chat completion request
- [ ] Add streaming support
- [ ] Calculate confidence score
- [ ] Add response validation
- [ ] Store AI trace

**Files to Create:**
- `apps/web/lib/ai/openrouter-client.ts`
- `apps/web/lib/ai/context-builder.ts`
- `apps/web/lib/ai/response-handler.ts`

**Success Criteria:**
- AI responds
- Context correct
- Streaming works

---

[Continue with remaining Phase 2 and Phase 3 tasks...]

---

## 📝 Task Completion Checklist

For each task, verify:
- [ ] Code written and tested locally
- [ ] Unit tests added (if applicable)
- [ ] Integration tests added (if applicable)
- [ ] E2E test added (for critical flows)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Responsive design verified (mobile + desktop)
- [ ] Accessibility checked (keyboard nav, screen reader)
- [ ] Code committed with clear message
- [ ] PR created (if using PR workflow)
- [ ] Deployed to staging
- [ ] Manual QA completed
- [ ] Documentation updated

---

## 🔄 Daily Development Routine with Claude Code

### Morning (9:00 AM - 12:00 PM)
1. Review previous day's work
2. Pick next highest priority task
3. Break task into sub-tasks (if needed)
4. Start coding with Claude Code
5. Write tests as you go

### Afternoon (1:00 PM - 5:00 PM)
6. Complete task implementation
7. Run full test suite
8. Manual QA testing
9. Commit and push code
10. Deploy to staging
11. Update task tracker

### End of Day
12. Document blockers
13. Plan next day's tasks
14. Update team (if applicable)

---

**Next:** Start with Sprint 1, Task 1.1 - Supabase Auth Configuration
