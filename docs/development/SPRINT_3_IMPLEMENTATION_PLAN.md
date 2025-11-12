# 🎯 Sprint 3: Lot Management - Implementation Plan

**Date:** November 12, 2025
**Status:** 📋 Ready for Build Phase
**Dependencies:** Sprint 1 (Auth) ✅, Sprint 2 (Properties) ✅

---

## 📊 Overview

Sprint 3 builds the lot (unit) management system within properties. Lots are the actual bookable units within a property (e.g., "Apartment A" in "Building XYZ"). This sprint enables property managers to create, configure, and manage individual rental units with their own pricing, amenities, images, and availability.

---

## 🎯 Sprint Goals

1. **Lot CRUD Operations** - Create, read, update, delete lots within properties
2. **Lot Images** - Upload and manage images for each lot
3. **Amenities Management** - Configure equipment and amenities per lot
4. **Pricing Configuration** - Set base prices, cleaning fees, and seasonal pricing
5. **Availability Calendar** - Basic calendar for blocking/unblocking dates
6. **Lot Details View** - Public-facing lot detail page for bookings

---

## 🏗️ Build Plan - 4 Parallel Agents

Based on Sprint 2 patterns, we'll deploy **4 build agents in parallel**:

### **Agent 1: Database Layer (Lot Enhancements)**
**Responsibility:** Database schema enhancements for lots, images, amenities, and availability

**Tasks:**
1. Create lot_images table (similar to property_images)
2. Create amenities table (reusable amenity definitions)
3. Create lot_amenities junction table (many-to-many)
4. Create availability_rules table (date blocking, pricing overrides)
5. Create lot_pricing_seasons table (seasonal pricing)
6. Add RLS policies to all new tables
7. Create database functions for conflict detection
8. Add indexes for performance

**Files to Create:**
- `supabase/migrations/20250112000011_lot_images.sql`
- `supabase/migrations/20250112000012_amenities.sql`
- `supabase/migrations/20250112000013_availability_rules.sql`
- `supabase/migrations/20250112000014_lot_pricing_seasons.sql`

**Schema Design:**

```sql
-- Lot Images (similar to property images)
CREATE TABLE lot_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INT,
  height INT,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Amenities (reusable catalog)
CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- 'essential', 'kitchen', 'bathroom', 'entertainment', 'outdoor'
  icon VARCHAR(50), -- Icon name for UI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lot Amenities (junction table)
CREATE TABLE lot_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE NOT NULL,
  quantity INT DEFAULT 1,
  notes TEXT,
  UNIQUE(lot_id, amenity_id)
);

-- Availability Rules (blocking dates, custom pricing)
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'blocked', 'price_override', 'min_stay'
  price_per_night DECIMAL(10, 2),
  min_nights INT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal Pricing (recurring pricing rules)
CREATE TABLE lot_pricing_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL, -- 'Summer 2026', 'Winter 2025-26'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  min_nights INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estimated Time:** 2-3 hours

---

### **Agent 2: Lot Backend (Server Actions & API)**
**Responsibility:** Server-side logic for lot management, images, amenities, and pricing

**Tasks:**
1. Create lot CRUD server actions
2. Create lot image upload/delete actions
3. Create amenity management actions
4. Create availability rule actions
5. Create pricing season actions
6. Add Zod validation schemas for all lot operations
7. Create helper functions for price calculation
8. Create conflict detection logic for availability

**Files to Create:**
- `apps/web/lib/actions/lots.ts` (CRUD operations)
- `apps/web/lib/actions/lot-images.ts` (image management)
- `apps/web/lib/actions/amenities.ts` (amenity operations)
- `apps/web/lib/actions/availability-rules.ts` (calendar blocking)
- `apps/web/lib/actions/pricing-seasons.ts` (seasonal pricing)
- `apps/web/lib/validations/lot.ts` (Zod schemas)
- `apps/web/lib/utils/pricing.ts` (price calculation)
- `apps/web/types/lot.ts` (TypeScript types)
- `apps/web/types/amenity.ts` (TypeScript types)

**Key Features:**
- ✅ Lot CRUD with validation
- ✅ Image upload to Supabase Storage (lot-specific paths)
- ✅ Amenity selection and configuration
- ✅ Date blocking and availability rules
- ✅ Seasonal pricing with priority handling
- ✅ Price calculation for date ranges
- ✅ Conflict detection for overlapping rules

**Estimated Time:** 3-4 hours

---

### **Agent 3: Lot List & Details Pages**
**Responsibility:** Lot listing within property, lot details view, and public lot page

**Tasks:**
1. Create lots list page within property details (dashboard)
2. Create lot details page (dashboard)
3. Create public lot detail page (for bookings)
4. Add lot card components
5. Add amenities display components
6. Add pricing display components
7. Add image gallery for lots
8. Add availability calendar view
9. Implement delete confirmation
10. Create empty states

**Files to Create:**
- `apps/web/app/dashboard/properties/[propertyId]/lots/page.tsx` (lots list)
- `apps/web/app/dashboard/properties/[propertyId]/lots/[lotId]/page.tsx` (lot details)
- `apps/web/app/lots/[lotId]/page.tsx` (public lot page)
- `apps/web/components/lots/lot-card.tsx`
- `apps/web/components/lots/lot-list.tsx`
- `apps/web/components/lots/lot-details.tsx`
- `apps/web/components/lots/lot-header.tsx`
- `apps/web/components/lots/amenities-list.tsx`
- `apps/web/components/lots/pricing-display.tsx`
- `apps/web/components/lots/availability-calendar.tsx`
- `apps/web/components/lots/delete-lot-modal.tsx`
- `apps/web/components/lots/lots-empty.tsx`
- `apps/web/components/lots/lots-loading.tsx`

**Key Features:**
- ✅ Lots displayed within property context
- ✅ Grid/list view for lots
- ✅ Lot details with all information
- ✅ Image gallery for each lot
- ✅ Amenities displayed with icons
- ✅ Pricing information clear and prominent
- ✅ Availability calendar view
- ✅ Delete confirmation modal
- ✅ Empty states and loading skeletons

**Estimated Time:** 4-5 hours

---

### **Agent 4: Lot Form & Calendar Components**
**Responsibility:** Lot creation/edit forms, amenity selection, pricing configuration, and calendar

**Tasks:**
1. Create multi-step lot form (3 steps: Basic Info, Amenities & Pricing, Images & Availability)
2. Create amenity selector component (checkboxes with categories)
3. Create pricing configuration component (base price + seasonal pricing)
4. Create availability calendar component (blocking dates)
5. Create image uploader for lots (reuse from Sprint 2)
6. Set up Zustand store for lot form state
7. Implement form validation with Zod
8. Create edit lot form (pre-fill existing data)
9. Add auto-save drafts functionality

**Files to Create:**
- `apps/web/app/dashboard/properties/[propertyId]/lots/new/page.tsx` (create lot)
- `apps/web/app/dashboard/properties/[propertyId]/lots/[lotId]/edit/page.tsx` (edit lot)
- `apps/web/app/dashboard/properties/[propertyId]/lots/new/components/LotForm.tsx`
- `apps/web/app/dashboard/properties/[propertyId]/lots/new/components/FormStepIndicator.tsx`
- `apps/web/app/dashboard/properties/[propertyId]/lots/new/components/steps/BasicInfoStep.tsx`
- `apps/web/app/dashboard/properties/[propertyId]/lots/new/components/steps/AmenitiesPricingStep.tsx`
- `apps/web/app/dashboard/properties/[propertyId]/lots/new/components/steps/ImagesAvailabilityStep.tsx`
- `apps/web/components/forms/AmenitySelector.tsx`
- `apps/web/components/forms/PricingConfiguration.tsx`
- `apps/web/components/calendar/AvailabilityCalendar.tsx`
- `apps/web/components/calendar/DateBlockModal.tsx`
- `apps/web/lib/stores/lotFormStore.ts`

**Form Steps:**

**Step 1: Basic Info**
- Title (required, 3-100 chars)
- Description (optional, 20-2000 chars)
- Bedrooms (1-50)
- Bathrooms (1-50)
- Max guests (1-100)
- Pets allowed (yes/no)
- Status (active, inactive, maintenance)

**Step 2: Amenities & Pricing**
- Amenity selector (grouped by category)
  - Essential: WiFi, heating, AC, parking
  - Kitchen: refrigerator, oven, microwave, dishwasher
  - Bathroom: shower, bathtub, hairdryer, washer
  - Entertainment: TV, streaming, games
  - Outdoor: balcony, terrace, garden, BBQ
- Base price per night
- Cleaning fee
- Tourist tax
- Seasonal pricing rules (optional)

**Step 3: Images & Availability**
- Image uploader (1-20 images, max 10MB each)
- Image preview grid
- Set primary image
- Availability calendar
  - Block specific dates (maintenance, personal use)
  - Set price overrides for specific dates
  - Set minimum stay rules

**Key Features:**
- ✅ 3-step form with progress indicator
- ✅ Step-by-step validation
- ✅ Amenity selection by category
- ✅ Pricing configuration (base + seasonal)
- ✅ Interactive calendar for blocking dates
- ✅ Image upload with preview
- ✅ Auto-save drafts
- ✅ Edit form pre-fills data

**Estimated Time:** 4-5 hours

---

## 📋 Dependencies & Installation

No new packages needed! We'll reuse:
- ✅ `react-dropzone` (image upload)
- ✅ `react-hook-form` (forms)
- ✅ `@hookform/resolvers` + `zod` (validation)
- ✅ `zustand` (state management)
- ✅ `date-fns` (date utilities)

**Calendar library:**
```bash
npm install react-big-calendar
npm install -D @types/react-big-calendar
```

---

## 🎨 UI/UX Specifications

### Lot Card (Grid View)
- Lot image (primary)
- Lot title
- Property name (breadcrumb)
- Bedrooms, bathrooms, guests
- Base price per night
- Status badge (active, inactive, maintenance)
- Hover actions: view, edit, delete

### Lot Details Page
- Image gallery at top
- Lot title and description
- Property context (link to property)
- Amenities grid (icons + labels)
- Pricing section (base price, cleaning fee, seasonal pricing)
- Availability calendar
- Reservations list (upcoming)
- Edit and delete buttons

### Amenity Categories
- **Essential:** WiFi, Heating, Air Conditioning, Parking, Smoke Detector, Fire Extinguisher
- **Kitchen:** Refrigerator, Oven, Microwave, Dishwasher, Coffee Machine, Kettle, Toaster
- **Bathroom:** Shower, Bathtub, Hairdryer, Washer, Dryer, Towels, Toiletries
- **Entertainment:** TV, Streaming Services, Board Games, Books, Workspace, Printer
- **Outdoor:** Balcony, Terrace, Garden, BBQ, Pool, Parking Spot

### Responsive Breakpoints
- **Mobile:** < 640px (1 column)
- **Tablet:** 640px - 1024px (2 columns)
- **Desktop:** > 1024px (3 columns)

---

## 🔒 Security Requirements

All build agents must implement:

1. **RLS Policies** on all new tables (org_id isolation)
2. **Input Validation** with Zod on client and server
3. **File Upload Validation** (type, size, count limits)
4. **Storage RLS** on lot images bucket
5. **Parameterized Queries** (SQL injection prevention)
6. **XSS Prevention** (React escaping)

**Lot-specific security:**
- Users can only manage lots in their organization
- Lot images stored in org-specific paths: `{org_id}/lots/{lot_id}/`
- Price calculations validated server-side
- Date ranges validated for conflicts

---

## ⚡ Performance Requirements

1. **Database Optimization:**
   - Indexes on lot_id, org_id, property_id
   - Indexes on date ranges for availability_rules
   - Junction table indexes for lot_amenities

2. **Query Optimization:**
   - Eager loading: lots with images, amenities, pricing
   - Select only needed columns
   - Pagination for large lot lists

3. **Calendar Performance:**
   - Load only visible date range
   - Cache availability rules
   - Debounce date selection

4. **Image Optimization:**
   - Reuse property image utilities
   - Client-side compression
   - Lazy loading in gallery

---

## ✅ Acceptance Criteria

### Agent 1: Database Layer
- [ ] All migrations run successfully
- [ ] RLS policies working correctly
- [ ] Indexes created on critical columns
- [ ] Amenities seeded with initial data
- [ ] Foreign key constraints working

### Agent 2: Backend
- [ ] All CRUD operations functional
- [ ] Image upload to Supabase Storage working
- [ ] Amenity assignment working
- [ ] Availability rules can be created/updated
- [ ] Pricing seasons working
- [ ] Price calculation logic correct
- [ ] Conflict detection functional

### Agent 3: List & Details Pages
- [ ] Lots list displays correctly within property
- [ ] Lot card shows all info
- [ ] Lot details page complete
- [ ] Public lot page working
- [ ] Image gallery with lightbox
- [ ] Amenities display with icons
- [ ] Pricing display clear
- [ ] Delete confirmation modal

### Agent 4: Form & Calendar
- [ ] All 3 form steps working
- [ ] Amenity selector by category
- [ ] Pricing configuration functional
- [ ] Availability calendar interactive
- [ ] Date blocking working
- [ ] Image upload working
- [ ] Form validation on each step
- [ ] Auto-save drafts
- [ ] Edit form pre-fills data

---

## 🧪 Testing Checklist

After build phase, verify:

- [ ] **Create Lot Flow:**
  - [ ] Complete form with all 3 steps
  - [ ] Select amenities from all categories
  - [ ] Set base price and seasonal pricing
  - [ ] Upload images (test 1, 5, 10 images)
  - [ ] Block specific dates on calendar
  - [ ] Submit successfully

- [ ] **View Lots:**
  - [ ] Lots list shows all lots for property
  - [ ] Grid view displays correctly
  - [ ] Lot cards show all information
  - [ ] Empty state when no lots
  - [ ] Loading skeletons

- [ ] **Lot Details:**
  - [ ] All information displays correctly
  - [ ] Image gallery functional
  - [ ] Amenities listed with icons
  - [ ] Pricing shown clearly
  - [ ] Availability calendar displays
  - [ ] Edit button navigates to form
  - [ ] Delete confirmation modal

- [ ] **Public Lot Page:**
  - [ ] Accessible without authentication
  - [ ] All information visible
  - [ ] Images display correctly
  - [ ] Amenities shown
  - [ ] Pricing visible
  - [ ] Availability calendar (read-only)
  - [ ] Book Now button (placeholder)

- [ ] **Multi-Tenant Security:**
  - [ ] User A cannot see User B's lots
  - [ ] User A cannot edit User B's lots
  - [ ] User A cannot delete User B's lots
  - [ ] RLS policies block cross-org access
  - [ ] Images only accessible to correct org

- [ ] **Pricing Logic:**
  - [ ] Base price calculates correctly
  - [ ] Seasonal pricing overrides base price
  - [ ] Cleaning fee added correctly
  - [ ] Tourist tax calculated
  - [ ] Multiple seasons handled correctly
  - [ ] Date range pricing accurate

---

## 📝 Implementation Notes

### For All Build Agents

1. **Follow Existing Patterns:**
   - Reuse Sprint 2 patterns for images
   - Match authentication patterns from Sprint 1
   - Use same UI components and styling
   - Follow same folder structure

2. **TypeScript Strict Mode:**
   - All files in strict mode
   - No `any` types
   - Proper type annotations
   - Shared types in `/types` folder

3. **Error Handling:**
   - User-friendly error messages
   - Graceful fallbacks
   - Loading states for async operations
   - Form validation errors displayed inline

4. **Accessibility:**
   - Keyboard navigation for calendar
   - ARIA labels for amenity checkboxes
   - Alt text for images
   - Focus management in modals

5. **Mobile Responsiveness:**
   - Touch-friendly calendar controls
   - Responsive image grid
   - Stacked form layout on mobile
   - Collapsible amenity categories

---

## 🚀 Launch Sequence

When ready to build:

1. **Install calendar dependency**
   ```bash
   npm install react-big-calendar @types/react-big-calendar
   ```

2. **Launch 4 Build Agents Simultaneously:**
   - Agent 1: Database Layer (Lot Enhancements)
   - Agent 2: Lot Backend (Server Actions & API)
   - Agent 3: Lot List & Details Pages
   - Agent 4: Lot Form & Calendar Components

3. **Wait for All Agents to Complete**

4. **Seed Amenities Data**
   ```bash
   npm run db:seed-amenities
   ```

5. **Integration Testing**

6. **Create Documentation**

7. **Commit and Push**

---

## 📊 Expected Timeline

**With 4 Parallel Build Agents:**
- Agent 1: 2-3 hours
- Agent 2: 3-4 hours
- Agent 3: 4-5 hours
- Agent 4: 4-5 hours

**Longest Running Agent:** ~4-5 hours
**Total Wallclock Time:** ~5 hours (vs 13-17 hours sequential)
**Speedup:** **~3x faster**

---

## 📦 Deliverables

After Sprint 3 completion, we'll have:

1. **Complete Lot Management System:**
   - Create, read, update, delete lots
   - Multi-step form with validation
   - Image upload and gallery per lot
   - Amenity selection and configuration
   - Pricing configuration (base + seasonal)
   - Availability calendar with date blocking

2. **Database Enhancements:**
   - lot_images table
   - amenities catalog
   - lot_amenities junction table
   - availability_rules table
   - lot_pricing_seasons table

3. **Integration with Existing System:**
   - Lots within property context
   - RLS policies for multi-tenancy
   - Reuse authentication guards
   - Consistent UI/UX with Sprint 2

4. **Public Lot Pages:**
   - Public-facing lot detail pages
   - SEO-friendly URLs
   - All lot information visible
   - Ready for booking integration (Sprint 4)

---

## ✅ Ready to Build!

All planning complete. Dependencies reviewed. Build plan created.

**Next Action:** Launch 4 build agents in parallel to implement the lot management system.

---

**Last Updated:** November 12, 2025
**Status:** 📋 Ready for Build Phase
**Dependencies:** Sprint 1 ✅, Sprint 2 ✅
**Implementation Plan:** ✅ Ready
