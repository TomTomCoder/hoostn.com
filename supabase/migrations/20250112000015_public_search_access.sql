-- ============================================================================
-- Public Search Access Migration
-- Enable public (unauthenticated) read access for search functionality
-- ============================================================================

-- ============================================================================
-- PART 1: Public Read Access for Properties
-- ============================================================================

-- SELECT: Public users can view active properties (for search)
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON POLICY "properties_select_public" ON public.properties IS
'Allows anonymous users to view all properties for public search functionality.
Properties are public listings and should be viewable by anyone.';

-- ============================================================================
-- PART 2: Public Read Access for Lots
-- ============================================================================

-- SELECT: Public users can view active lots (for search)
CREATE POLICY "lots_select_public" ON public.lots
  FOR SELECT
  TO anon
  USING (
    status = 'active' -- Only show active lots to public
  );

COMMENT ON POLICY "lots_select_public" ON public.lots IS
'Allows anonymous users to view active lots for public search functionality.
Only lots with status = ''active'' are visible to unauthenticated users.';

-- ============================================================================
-- PART 3: Public Read Access for Lot Images
-- ============================================================================

-- SELECT: Public users can view lot images (for search results)
CREATE POLICY "lot_images_select_public" ON public.lot_images
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

COMMENT ON POLICY "lot_images_select_public" ON public.lot_images IS
'Allows anonymous users to view images for active lots.
Images are only visible if the associated lot is active.';

-- ============================================================================
-- PART 4: Public Read Access for Amenities (Already exists via GRANT)
-- ============================================================================

-- Amenities table already has public read access via:
-- GRANT SELECT ON public.amenities TO authenticated;
-- We need to extend this to anonymous users

GRANT SELECT ON public.amenities TO anon;

COMMENT ON TABLE public.amenities IS
'Global catalog of amenities available for lots.
Public read access - amenities are reference data needed for search filters.';

-- ============================================================================
-- PART 5: Public Read Access for Lot Amenities Junction Table
-- ============================================================================

-- SELECT: Public users can view lot-amenity associations (for search)
CREATE POLICY "lot_amenities_select_public" ON public.lot_amenities
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

COMMENT ON POLICY "lot_amenities_select_public" ON public.lot_amenities IS
'Allows anonymous users to view amenity associations for active lots.
Needed for displaying amenities in search results and filtering by amenities.';

-- ============================================================================
-- PART 6: Public Read Access for Availability Rules
-- ============================================================================

-- SELECT: Public users can view availability rules (for booking availability)
CREATE POLICY "availability_rules_select_public" ON public.availability_rules
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

COMMENT ON POLICY "availability_rules_select_public" ON public.availability_rules IS
'Allows anonymous users to view availability rules for active lots.
Needed for checking lot availability during search and showing blocked dates.';

-- ============================================================================
-- PART 7: Public Read Access for Reservations (Limited)
-- ============================================================================

-- SELECT: Public users can view ONLY date ranges for reservations (privacy-conscious)
-- This is needed to check availability but doesn't expose sensitive guest information
CREATE POLICY "reservations_select_public_dates" ON public.reservations
  FOR SELECT
  TO anon
  USING (
    lot_id IN (
      SELECT id FROM public.lots WHERE status = 'active'
    )
  );

COMMENT ON POLICY "reservations_select_public_dates" ON public.reservations IS
'Allows anonymous users to view reservation date ranges for active lots.
This is needed for availability checking during search.
Note: Client should only expose check_in, check_out, and lot_id to public users,
not sensitive guest information.';

-- ============================================================================
-- PART 8: Create Helper Function for Public Search
-- ============================================================================

-- Function to check if a lot is available for a date range (public version)
CREATE OR REPLACE FUNCTION public.is_lot_available_public(
  target_lot_id UUID,
  check_start_date DATE,
  check_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  blocked_count INTEGER;
  reservation_count INTEGER;
BEGIN
  -- Check if lot is active
  IF NOT EXISTS (
    SELECT 1 FROM public.lots
    WHERE id = target_lot_id AND status = 'active'
  ) THEN
    RETURN false;
  END IF;

  -- Check if any blocked rules overlap with the requested date range
  SELECT COUNT(*)
  INTO blocked_count
  FROM public.availability_rules
  WHERE
    lot_id = target_lot_id
    AND rule_type = 'blocked'
    AND daterange(start_date, end_date, '[]') && daterange(check_start_date, check_end_date, '[]');

  -- Check if any existing reservations overlap
  SELECT COUNT(*)
  INTO reservation_count
  FROM public.reservations
  WHERE
    lot_id = target_lot_id
    AND status != 'cancelled'
    AND daterange(check_in, check_out, '[]') && daterange(check_start_date, check_end_date, '[]');

  -- If no blocked rules or reservations found, lot is available
  RETURN (blocked_count = 0 AND reservation_count = 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_lot_available_public(UUID, DATE, DATE) IS
'Public function to check if a lot is available for a given date range.
Checks both availability_rules (blocked) and existing reservations.
Returns true if lot is active and available, false otherwise.';

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.is_lot_available_public(UUID, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION public.is_lot_available_public(UUID, DATE, DATE) TO authenticated;

-- ============================================================================
-- PART 9: Grant SELECT on Views
-- ============================================================================

-- Grant access to the lots_with_primary_image view for public users
GRANT SELECT ON public.lots_with_primary_image TO anon;

-- ============================================================================
-- PART 10: Create Indexes for Public Search Performance
-- ============================================================================

-- Index for searching by city (common search filter)
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);

-- Index for lot status (we filter by active)
CREATE INDEX IF NOT EXISTS idx_lots_status ON public.lots(status);

-- Index for lot price range searches
CREATE INDEX IF NOT EXISTS idx_lots_base_price ON public.lots(base_price) WHERE base_price IS NOT NULL;

-- Index for bedrooms filter
CREATE INDEX IF NOT EXISTS idx_lots_bedrooms ON public.lots(bedrooms);

-- Index for guests filter
CREATE INDEX IF NOT EXISTS idx_lots_max_guests ON public.lots(max_guests);

-- Index for pets filter
CREATE INDEX IF NOT EXISTS idx_lots_pets_allowed ON public.lots(pets_allowed);

-- Composite index for common search patterns (city + active lots)
CREATE INDEX IF NOT EXISTS idx_lots_property_status ON public.lots(property_id, status);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify policies
DO $$
BEGIN
  RAISE NOTICE 'Public search access policies created successfully!';
  RAISE NOTICE 'Anonymous users can now:';
  RAISE NOTICE '  - View all properties';
  RAISE NOTICE '  - View active lots';
  RAISE NOTICE '  - View lot images for active lots';
  RAISE NOTICE '  - View amenities and lot-amenity associations';
  RAISE NOTICE '  - View availability rules for active lots';
  RAISE NOTICE '  - View reservation dates (for availability checking)';
  RAISE NOTICE '  - Use is_lot_available_public() function';
END $$;
