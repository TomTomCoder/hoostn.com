-- ============================================================================
-- Amenities Tables Migration
-- Catalog of reusable amenities and lot-amenity associations
-- ============================================================================

-- ============================================================================
-- PART 1: Create Amenities Catalog Table
-- ============================================================================

-- Drop tables if they exist (idempotent migration)
DROP TABLE IF EXISTS public.lot_amenities CASCADE;
DROP TABLE IF EXISTS public.amenities CASCADE;

-- Amenities catalog table (global, reusable across all lots)
CREATE TABLE public.amenities (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Amenity details
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,  -- 'essential', 'kitchen', 'bathroom', 'entertainment', 'outdoor'
  icon VARCHAR(50),               -- Icon name for UI (e.g., 'wifi', 'tv', 'parking')

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_amenity_category CHECK (
    category IN ('essential', 'kitchen', 'bathroom', 'entertainment', 'outdoor')
  )
);

-- Add table comment
COMMENT ON TABLE public.amenities IS
'Global catalog of amenities available for lots.
No RLS needed - this is a public reference table.';

-- Add column comments
COMMENT ON COLUMN public.amenities.name IS 'Unique name of the amenity (e.g., "WiFi", "Air Conditioning").';
COMMENT ON COLUMN public.amenities.category IS 'Category for grouping amenities in UI. One of: essential, kitchen, bathroom, entertainment, outdoor.';
COMMENT ON COLUMN public.amenities.icon IS 'Icon identifier for UI rendering (e.g., "wifi", "tv", "parking").';

-- ============================================================================
-- PART 2: Create Lot Amenities Junction Table
-- ============================================================================

-- Junction table for many-to-many relationship between lots and amenities
CREATE TABLE public.lot_amenities (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Optional details
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_lot_amenity UNIQUE (lot_id, amenity_id)
);

-- Add table comment
COMMENT ON TABLE public.lot_amenities IS
'Junction table linking lots to amenities.
RLS: org isolation, all members can view, admins can manage.';

-- Add column comments
COMMENT ON COLUMN public.lot_amenities.quantity IS 'Number of this amenity available (e.g., 2 TVs, 3 beds).';
COMMENT ON COLUMN public.lot_amenities.notes IS 'Optional notes about this specific amenity instance (e.g., "50-inch Smart TV", "Queen size bed").';

-- ============================================================================
-- PART 3: Create Indexes for Performance
-- ============================================================================

-- Indexes on amenities table
CREATE INDEX idx_amenities_category ON public.amenities(category);
CREATE INDEX idx_amenities_name ON public.amenities(name);

-- Indexes on lot_amenities junction table
CREATE INDEX idx_lot_amenities_lot_id ON public.lot_amenities(lot_id);
CREATE INDEX idx_lot_amenities_amenity_id ON public.lot_amenities(amenity_id);
CREATE INDEX idx_lot_amenities_org_id ON public.lot_amenities(org_id);

-- Composite index for common query patterns
CREATE INDEX idx_lot_amenities_lot_org ON public.lot_amenities(lot_id, org_id);

-- ============================================================================
-- PART 4: Enable Row Level Security
-- ============================================================================

-- Amenities table is a public catalog - no RLS needed (everyone can read)
-- This is intentional - amenities are not tenant-specific

-- Enable RLS on lot_amenities table (tenant isolation required)
ALTER TABLE public.lot_amenities ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (security best practice)
ALTER TABLE public.lot_amenities FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: Create RLS Policies for Lot Amenities
-- ============================================================================

-- SELECT: All org members can view their lots' amenities
CREATE POLICY "lot_amenities_select_org" ON public.lot_amenities
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins/owners can add amenities to their org's lots
CREATE POLICY "lot_amenities_insert_admin" ON public.lot_amenities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND lot_id IN (
      SELECT id FROM public.lots WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update amenity details
CREATE POLICY "lot_amenities_update_admin" ON public.lot_amenities
  FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- DELETE: Admins/owners can remove amenities from lots
CREATE POLICY "lot_amenities_delete_admin" ON public.lot_amenities
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 6: Grant Permissions
-- ============================================================================

-- Grant read access to amenities catalog for all authenticated users
GRANT SELECT ON public.amenities TO authenticated;

-- ============================================================================
-- PART 7: Seed Initial Amenities Data
-- ============================================================================

-- Insert essential amenities
INSERT INTO public.amenities (name, category, icon) VALUES
  ('WiFi', 'essential', 'wifi'),
  ('Heating', 'essential', 'heating'),
  ('Air Conditioning', 'essential', 'ac_unit'),
  ('Parking', 'essential', 'local_parking'),
  ('Smoke Detector', 'essential', 'smoke_detector'),
  ('Fire Extinguisher', 'essential', 'fire_extinguisher'),
  ('First Aid Kit', 'essential', 'medical_services'),
  ('Security System', 'essential', 'security');

-- Insert kitchen amenities
INSERT INTO public.amenities (name, category, icon) VALUES
  ('Refrigerator', 'kitchen', 'kitchen'),
  ('Oven', 'kitchen', 'oven'),
  ('Microwave', 'kitchen', 'microwave'),
  ('Dishwasher', 'kitchen', 'dishwasher'),
  ('Coffee Machine', 'kitchen', 'coffee'),
  ('Kettle', 'kitchen', 'kettle'),
  ('Toaster', 'kitchen', 'toaster'),
  ('Blender', 'kitchen', 'blender'),
  ('Cookware', 'kitchen', 'restaurant'),
  ('Utensils', 'kitchen', 'flatware');

-- Insert bathroom amenities
INSERT INTO public.amenities (name, category, icon) VALUES
  ('Shower', 'bathroom', 'shower'),
  ('Bathtub', 'bathroom', 'bathtub'),
  ('Hairdryer', 'bathroom', 'hairdryer'),
  ('Washer', 'bathroom', 'local_laundry_service'),
  ('Dryer', 'bathroom', 'dry'),
  ('Towels', 'bathroom', 'towel'),
  ('Toiletries', 'bathroom', 'soap'),
  ('Iron', 'bathroom', 'iron');

-- Insert entertainment amenities
INSERT INTO public.amenities (name, category, icon) VALUES
  ('TV', 'entertainment', 'tv'),
  ('Streaming Services', 'entertainment', 'movie'),
  ('Board Games', 'entertainment', 'extension'),
  ('Books', 'entertainment', 'book'),
  ('Workspace', 'entertainment', 'desk'),
  ('Printer', 'entertainment', 'print'),
  ('Sound System', 'entertainment', 'speaker'),
  ('Game Console', 'entertainment', 'gamepad');

-- Insert outdoor amenities
INSERT INTO public.amenities (name, category, icon) VALUES
  ('Balcony', 'outdoor', 'balcony'),
  ('Terrace', 'outdoor', 'deck'),
  ('Garden', 'outdoor', 'yard'),
  ('BBQ Grill', 'outdoor', 'outdoor_grill'),
  ('Pool', 'outdoor', 'pool'),
  ('Hot Tub', 'outdoor', 'hot_tub'),
  ('Outdoor Furniture', 'outdoor', 'chair'),
  ('Bike Storage', 'outdoor', 'pedal_bike');

-- ============================================================================
-- PART 8: Create Helper Functions
-- ============================================================================

-- Function to get all amenities for a lot grouped by category
CREATE OR REPLACE FUNCTION public.get_lot_amenities_by_category(target_lot_id UUID)
RETURNS TABLE (
  category VARCHAR,
  amenity_id UUID,
  amenity_name VARCHAR,
  icon VARCHAR,
  quantity INTEGER,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.category,
    a.id AS amenity_id,
    a.name AS amenity_name,
    a.icon,
    la.quantity,
    la.notes
  FROM public.lot_amenities la
  INNER JOIN public.amenities a ON la.amenity_id = a.id
  WHERE la.lot_id = target_lot_id
    AND la.org_id = public.get_user_org_id()
  ORDER BY a.category, a.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lot_amenities_by_category(UUID) IS
'Returns all amenities for a lot grouped and ordered by category.
Respects RLS policies (only returns amenities from user''s org).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lot_amenities_by_category(UUID) TO authenticated;

-- Function to check if a lot has a specific amenity
CREATE OR REPLACE FUNCTION public.lot_has_amenity(target_lot_id UUID, target_amenity_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.lot_amenities la
    INNER JOIN public.amenities a ON la.amenity_id = a.id
    WHERE la.lot_id = target_lot_id
      AND a.name = target_amenity_name
      AND la.org_id = public.get_user_org_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.lot_has_amenity(UUID, VARCHAR) IS
'Checks if a lot has a specific amenity by name.
Returns true if the amenity exists for the lot, false otherwise.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.lot_has_amenity(UUID, VARCHAR) TO authenticated;

-- ============================================================================
-- PART 9: Create View for Easy Querying
-- ============================================================================

-- View to get lots with their amenity counts
CREATE OR REPLACE VIEW public.lots_with_amenity_counts AS
SELECT
  l.*,
  COUNT(DISTINCT la.amenity_id) AS amenity_count
FROM public.lots l
LEFT JOIN public.lot_amenities la ON l.id = la.lot_id
GROUP BY l.id;

COMMENT ON VIEW public.lots_with_amenity_counts IS
'Lots with their total amenity count for quick overview.
Useful for displaying amenity counts in lot listings.';

-- Grant select on the view to authenticated users
GRANT SELECT ON public.lots_with_amenity_counts TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
