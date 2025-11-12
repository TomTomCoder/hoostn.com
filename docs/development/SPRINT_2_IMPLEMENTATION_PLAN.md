# 🎯 Sprint 2: Property Management - Implementation Plan

**Date:** November 12, 2025
**Exploration Phase:** ✅ Complete
**Status:** Ready for Build Phase

---

## 📊 Exploration Summary

Our 4 exploration agents have completed comprehensive research across all aspects of property management. Here's what we found:

### Agent 1: Property CRUD UI/UX Patterns ✅
**Key Findings:**
- Grid view with toggle option (grid/list) recommended
- Multi-step form with 3 steps (Basic Info, Location, Contact/Settings)
- Server Components for data fetching, Client Components for interactivity
- Debounced search (300ms) for performance
- Modal-based delete confirmation
- Zustand + localStorage for form state persistence

### Agent 2: Image Upload & Gallery ✅
**Key Findings:**
- react-dropzone recommended for upload (lightweight, proven)
- Supabase Storage with multi-tenant path structure: `org_id/properties/property_id/`
- Client-side image optimization before upload
- Lightbox gallery for fullscreen viewing
- Store metadata in PostgreSQL, files in Supabase Storage
- RLS policies on storage buckets for security

### Agent 3: Geocoding & Mapping ✅
**Key Findings:**
- **Mapbox recommended** over Google Maps (better free tier, 3-5x cheaper)
- Free tier: 100k geocoding requests + 50k map loads/month
- Address autocomplete with Mapbox Search API
- PostGIS extension for geospatial queries
- Cache coordinates in database (allowed by Mapbox ToS)
- react-map-gl for React integration

### Agent 4: Multi-Step Forms & Validation ✅
**Key Findings:**
- Single-page approach with client-side step management
- React Hook Form + Zod for validation
- Zustand with persist middleware for state management
- Server Actions for form submission
- Auto-save drafts every 2 seconds (debounced)
- File uploads at final submit (prevents orphaned files)

---

## 🏗️ Build Plan - 5 Parallel Agents

Based on exploration findings, we'll deploy **5 build agents in parallel**:

### **Agent 1: Database & Storage Setup**
**Responsibility:** Database schema enhancements + Supabase Storage configuration

**Tasks:**
1. Create property images table migration
2. Add PostGIS extension for geospatial queries
3. Add geocoding metadata columns to properties table
4. Create property drafts table for auto-save
5. Set up Supabase Storage bucket with RLS policies
6. Create indexes for performance

**Files to Create:**
- `supabase/migrations/20250112000007_property_images.sql`
- `supabase/migrations/20250112000008_enable_postgis.sql`
- `supabase/migrations/20250112000009_property_drafts.sql`
- `supabase/migrations/20250112000010_geocoding_columns.sql`

**Estimated Time:** 2-3 hours

---

### **Agent 2: Property Backend (Server Actions & API)**
**Responsibility:** Server-side logic, geocoding, file uploads

**Tasks:**
1. Create property CRUD server actions
2. Implement Mapbox geocoding integration
3. Create draft auto-save server actions
4. Implement image upload to Supabase Storage
5. Add form validation with Zod schemas
6. Create geocoding API route

**Files to Create:**
- `apps/web/app/actions/properties.ts` (create/update/delete property)
- `apps/web/app/actions/property-drafts.ts` (save/load/delete drafts)
- `apps/web/app/actions/geocode-property.ts` (geocoding)
- `apps/web/app/actions/image-upload.ts` (upload to Supabase Storage)
- `apps/web/lib/validations/property.ts` (Zod schemas)
- `apps/web/lib/geocoding/mapbox.ts` (geocoding utilities)
- `apps/web/lib/utils/image.ts` (image utilities)

**Estimated Time:** 3-4 hours

---

### **Agent 3: Property List & Details Pages**
**Responsibility:** Property listing, search, filtering, details view

**Tasks:**
1. Create properties list page (Server Component)
2. Implement grid/list view toggle
3. Add search and filtering (debounced)
4. Create property details page with image gallery
5. Add map display on details page
6. Implement delete confirmation modal
7. Create empty states and loading skeletons

**Files to Create:**
- `apps/web/app/dashboard/properties/page.tsx` (list page)
- `apps/web/app/dashboard/properties/[id]/page.tsx` (details page)
- `apps/web/components/properties/properties-header.tsx` (search/filters)
- `apps/web/components/properties/properties-list.tsx` (grid/list wrapper)
- `apps/web/components/properties/property-card.tsx` (grid item)
- `apps/web/components/properties/property-list-item.tsx` (list item)
- `apps/web/components/properties/property-details.tsx` (details view)
- `apps/web/components/properties/property-header.tsx` (details header)
- `apps/web/components/properties/delete-property-modal.tsx`
- `apps/web/components/properties/properties-empty.tsx`
- `apps/web/components/properties/properties-loading.tsx`

**Estimated Time:** 4-5 hours

---

### **Agent 4: Multi-Step Property Form**
**Responsibility:** Property creation/edit form with validation and auto-save

**Tasks:**
1. Create multi-step form component structure
2. Implement step indicator with progress
3. Create Step 1: Basic Info (name, description, type, bedrooms, bathrooms)
4. Create Step 2: Address & Location (with address autocomplete)
5. Create Step 3: Contact & Settings (with image upload)
6. Set up Zustand store for form state
7. Implement auto-save drafts functionality
8. Add form validation with Zod
9. Create edit property form (reusing components)

**Files to Create:**
- `apps/web/app/dashboard/properties/new/page.tsx` (main form page)
- `apps/web/app/dashboard/properties/new/components/PropertyForm.tsx`
- `apps/web/app/dashboard/properties/new/components/FormStepIndicator.tsx`
- `apps/web/app/dashboard/properties/new/components/steps/BasicInfoStep.tsx`
- `apps/web/app/dashboard/properties/new/components/steps/AddressStep.tsx`
- `apps/web/app/dashboard/properties/new/components/steps/ContactSettingsStep.tsx`
- `apps/web/app/dashboard/properties/[id]/edit/page.tsx` (edit form)
- `apps/web/lib/stores/propertyFormStore.ts` (Zustand store)
- `apps/web/hooks/use-debounce.ts`

**Estimated Time:** 4-5 hours

---

### **Agent 5: Shared Components (Image, Map, Autocomplete)**
**Responsibility:** Reusable components for images, maps, and address autocomplete

**Tasks:**
1. Create image uploader component (react-dropzone)
2. Create image gallery component with lightbox
3. Create property map component (Mapbox GL)
4. Create properties cluster map (multiple markers)
5. Create address autocomplete component
6. Create manual location picker (draggable pin)
7. Add image optimization utilities

**Files to Create:**
- `apps/web/components/dashboard/ImageUploader.tsx`
- `apps/web/components/dashboard/ImageGallery.tsx`
- `apps/web/components/dashboard/PropertyImageManager.tsx`
- `apps/web/components/maps/PropertyMap.tsx` (single property)
- `apps/web/components/maps/PropertiesMap.tsx` (multiple properties)
- `apps/web/components/maps/PropertiesClusterMap.tsx` (with clustering)
- `apps/web/components/maps/ManualLocationPicker.tsx`
- `apps/web/components/forms/AddressAutocomplete.tsx`
- `apps/web/types/image.ts` (TypeScript types)

**Estimated Time:** 3-4 hours

---

## 📋 Dependencies & Installation

Before building, install these packages:

```bash
# Image upload
npm install react-dropzone

# Maps and geocoding
npm install @mapbox/mapbox-sdk mapbox-gl react-map-gl
npm install -D @types/mapbox-gl

# Form management
npm install react-hook-form @hookform/resolvers zod

# State management (already installed)
# npm install zustand

# Date utilities (already installed)
# npm install date-fns
```

---

## 🔑 Environment Variables

Add to `.env.local`:

```bash
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...   # Public token for client-side maps
MAPBOX_SECRET_TOKEN=sk.eyJ...        # Secret token for server-side geocoding

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🎨 UI/UX Specifications

### Color Palette (Hoostn Brand)
- **Primary:** #1F3A8A (Ocean Blue)
- **Accent:** #00C48C (Turquoise Green)
- **Gray Anthracite:** #2D3748
- **Error:** #EF4444 (Red)
- **Success:** #10B981 (Green)

### Responsive Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Layout Patterns
- Grid view: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- List view: Full width with horizontal card layout
- Max container width: 1280px (max-w-7xl)

---

## 🔒 Security Requirements

All build agents must implement:

1. **RLS Policies** on all new tables (org_id isolation)
2. **Input Validation** with Zod on both client and server
3. **SQL Injection Prevention** via parameterized queries
4. **XSS Prevention** via React escaping (no dangerouslySetInnerHTML)
5. **File Upload Validation** (type, size, count limits)
6. **Storage RLS** on Supabase Storage buckets

---

## ⚡ Performance Requirements

1. **Image Optimization:**
   - Client-side compression before upload
   - Max 10MB per image
   - Generate thumbnails for gallery

2. **Database Queries:**
   - Use indexes on org_id, created_at
   - Limit results (pagination)
   - Select only needed columns

3. **Geocoding:**
   - Cache coordinates in database
   - Debounce autocomplete (300-500ms)
   - Rate limit API calls

4. **Maps:**
   - Lazy load map components
   - Use clustering for 100+ properties
   - Static map images for thumbnails

---

## ✅ Acceptance Criteria

### Agent 1: Database & Storage
- [ ] All migrations run successfully
- [ ] RLS policies tested and working
- [ ] PostGIS extension enabled
- [ ] Storage bucket created with correct permissions
- [ ] Indexes created on critical columns

### Agent 2: Backend
- [ ] All CRUD operations working
- [ ] Geocoding integration functional
- [ ] Image upload to Supabase Storage working
- [ ] Draft auto-save implemented
- [ ] Validation working on server-side

### Agent 3: List & Details Pages
- [ ] Properties list displays correctly
- [ ] Grid/list toggle working
- [ ] Search and filtering functional
- [ ] Property details page shows all info
- [ ] Image gallery working with lightbox
- [ ] Map displays property location
- [ ] Delete confirmation modal functional

### Agent 4: Property Form
- [ ] All 3 steps working
- [ ] Form validation on each step
- [ ] Auto-save drafts every 2 seconds
- [ ] Progress indicator shows current step
- [ ] Can navigate back/forward
- [ ] File upload working
- [ ] Edit form pre-fills existing data

### Agent 5: Shared Components
- [ ] Image uploader with drag-drop working
- [ ] Image gallery with delete/reorder
- [ ] Property map displays correctly
- [ ] Multi-property map with markers
- [ ] Address autocomplete functional
- [ ] Manual location picker (draggable pin)

---

## 🧪 Testing Checklist

After build phase, verify:

- [ ] **Create Property Flow:**
  - [ ] Complete form with all steps
  - [ ] Upload images (test 1, 5, 10 images)
  - [ ] Geocode address
  - [ ] Auto-save drafts
  - [ ] Submit successfully

- [ ] **View Properties:**
  - [ ] Grid view displays properties
  - [ ] List view displays properties
  - [ ] Toggle between views
  - [ ] Search by name/city
  - [ ] Filter by city/country
  - [ ] Empty state shows when no properties

- [ ] **Property Details:**
  - [ ] All information displays correctly
  - [ ] Image gallery functional
  - [ ] Map shows correct location
  - [ ] Edit button navigates to edit form
  - [ ] Delete confirmation modal works

- [ ] **Multi-Tenant Security:**
  - [ ] User A cannot see User B's properties
  - [ ] User A cannot edit User B's properties
  - [ ] User A cannot delete User B's properties
  - [ ] RLS policies block cross-org access

- [ ] **Performance:**
  - [ ] List page loads < 3 seconds
  - [ ] Details page loads < 2 seconds
  - [ ] Image upload shows progress
  - [ ] Autocomplete responds quickly (< 500ms)
  - [ ] Map loads < 2 seconds

---

## 📝 Implementation Notes

### For All Build Agents

1. **Follow Existing Patterns:**
   - Use same authentication patterns as Sprint 1
   - Match Hoostn brand colors
   - Follow accessibility guidelines (WCAG 2.1 AA)
   - Use Server Components by default

2. **TypeScript Strict Mode:**
   - All files in strict mode
   - No `any` types
   - Proper type annotations

3. **Error Handling:**
   - User-friendly error messages
   - Graceful fallbacks
   - Loading states for async operations

4. **Mobile Responsiveness:**
   - Test on mobile breakpoints
   - Touch-friendly controls (min 44px)
   - Responsive images

5. **Documentation:**
   - Add JSDoc comments for complex functions
   - Include usage examples in components
   - Document API endpoints

---

## 🚀 Launch Sequence

When ready to build:

1. **Install Dependencies** (already done in this conversation)
2. **Configure Environment Variables** (Mapbox tokens)
3. **Launch 5 Build Agents Simultaneously:**
   - Agent 1: Database & Storage
   - Agent 2: Backend
   - Agent 3: List & Details Pages
   - Agent 4: Property Form
   - Agent 5: Shared Components
4. **Wait for All Agents to Complete**
5. **Integration Testing**
6. **Create Documentation**
7. **Commit and Push**

---

## 📊 Expected Timeline

**With 5 Parallel Build Agents:**
- Agent 1: 2-3 hours
- Agent 2: 3-4 hours
- Agent 3: 4-5 hours
- Agent 4: 4-5 hours
- Agent 5: 3-4 hours

**Longest Running Agent:** ~4-5 hours
**Total Wallclock Time:** ~5-6 hours (vs 16-20 hours sequential)
**Speedup:** **~3-4x faster**

---

## 📦 Deliverables

After Sprint 2 completion, we'll have:

1. **Complete Property Management System:**
   - Create, read, update, delete properties
   - Multi-step form with validation
   - Image upload and gallery
   - Address geocoding and maps
   - Search and filtering

2. **Database Enhancements:**
   - Property images table
   - Property drafts table
   - PostGIS for geospatial queries
   - Geocoding metadata columns

3. **Integration with Existing System:**
   - RLS policies for multi-tenancy
   - Authentication guards
   - Hoostn brand styling
   - Responsive design

4. **Documentation:**
   - API documentation
   - Component usage examples
   - Testing strategy
   - Deployment guide

---

## ✅ Ready to Build!

All exploration is complete. Research findings consolidated. Build plan created.

**Next Action:** Launch 5 build agents in parallel to implement the property management system.

---

**Last Updated:** November 12, 2025
**Status:** 📋 Ready for Build Phase
**Exploration Complete:** ✅ Yes (4 agents)
**Implementation Plan:** ✅ Ready
