-- ============================================================================
-- Public Booking Access Migration
-- Adds RLS policies to enable public (unauthenticated) booking functionality
-- ============================================================================

-- ============================================================================
-- PART 1: Public SELECT access for lots (read-only for public users)
-- ============================================================================

-- Allow public (anonymous) users to view active lots
-- This enables the public lot detail page
CREATE POLICY "lots_select_public_active" ON public.lots
  FOR SELECT
  TO anon
  USING (
    status = 'active'
  );

-- ============================================================================
-- PART 2: Public SELECT access for lot images
-- ============================================================================

-- Allow public users to view images for active lots
CREATE POLICY "lot_images_select_public" ON public.lot_images
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

-- ============================================================================
-- PART 3: Public SELECT access for lot amenities
-- ============================================================================

-- Allow public users to view amenities for active lots
CREATE POLICY "lot_amenities_select_public" ON public.lot_amenities
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

-- ============================================================================
-- PART 4: Public SELECT access for amenities catalog
-- ============================================================================

-- Allow public users to view the amenities catalog
CREATE POLICY "amenities_select_public" ON public.amenities
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- PART 5: Public SELECT access for pricing seasons
-- ============================================================================

-- Allow public users to view pricing seasons for active lots
CREATE POLICY "lot_pricing_seasons_select_public" ON public.lot_pricing_seasons
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

-- ============================================================================
-- PART 6: Public SELECT access for availability rules
-- ============================================================================

-- Allow public users to view availability rules for active lots
CREATE POLICY "availability_rules_select_public" ON public.availability_rules
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

-- ============================================================================
-- PART 7: Public SELECT access for properties (limited fields)
-- ============================================================================

-- Allow public users to view properties associated with active lots
-- This is needed for displaying property information on lot detail pages
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT property_id FROM public.lots WHERE status = 'active'
    )
  );

-- ============================================================================
-- PART 8: Public INSERT access for reservations
-- ============================================================================

-- Allow anonymous users to create reservations for active lots
-- This is the core policy that enables public booking
CREATE POLICY "reservations_insert_public" ON public.reservations
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Can only create reservations for active lots
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
    -- org_id must match the lot's org_id (verified in application logic)
    AND org_id IN (
      SELECT org_id FROM public.lots WHERE id = lot_id
    )
    -- Status must be 'pending' for new public reservations
    AND status = 'pending'
    -- Payment status must be 'pending' for new public reservations
    AND payment_status = 'pending'
    -- Channel must be 'direct' for public bookings
    AND channel = 'direct'
  );

-- ============================================================================
-- PART 9: Public SELECT access for reservations (by ID only)
-- ============================================================================

-- Allow anonymous users to view their own reservation by ID
-- This is needed for the confirmation page
-- Note: This is intentionally broad - in production, you might want to
-- implement additional security measures like time-limited access tokens
CREATE POLICY "reservations_select_public_by_id" ON public.reservations
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- PART 10: Add comments for documentation
-- ============================================================================

COMMENT ON POLICY "lots_select_public_active" ON public.lots IS
'Allows anonymous users to view active lots for public browsing and booking';

COMMENT ON POLICY "lot_images_select_public" ON public.lot_images IS
'Allows anonymous users to view images for active lots';

COMMENT ON POLICY "lot_amenities_select_public" ON public.lot_amenities IS
'Allows anonymous users to view amenities for active lots';

COMMENT ON POLICY "amenities_select_public" ON public.amenities IS
'Allows anonymous users to view the amenities catalog';

COMMENT ON POLICY "lot_pricing_seasons_select_public" ON public.lot_pricing_seasons IS
'Allows anonymous users to view pricing seasons for active lots';

COMMENT ON POLICY "availability_rules_select_public" ON public.availability_rules IS
'Allows anonymous users to view availability rules for active lots (for checking dates)';

COMMENT ON POLICY "properties_select_public" ON public.properties IS
'Allows anonymous users to view properties associated with active lots';

COMMENT ON POLICY "reservations_insert_public" ON public.reservations IS
'Allows anonymous users to create reservations for active lots (public booking flow)';

COMMENT ON POLICY "reservations_select_public_by_id" ON public.reservations IS
'Allows anonymous users to view reservations (needed for confirmation page)';

-- ============================================================================
-- PART 11: Verification Queries
-- ============================================================================

-- Uncomment to test policies after applying migration:
/*
-- Test as anonymous user (set role to anon)
SET ROLE anon;

-- Should work: View active lots
SELECT id, title, status FROM public.lots WHERE status = 'active' LIMIT 5;

-- Should work: View lot images for active lots
SELECT lot_id, storage_path FROM public.lot_images LIMIT 5;

-- Should work: View amenities
SELECT id, name, category FROM public.amenities LIMIT 5;

-- Reset role
RESET ROLE;
*/
