-- ============================================================================
-- Property Images Table Migration
-- Storage layer for property image metadata and organization
-- ============================================================================

-- ============================================================================
-- PART 1: Create Property Images Table
-- ============================================================================

-- Drop table if it exists (idempotent migration)
DROP TABLE IF EXISTS public.property_images CASCADE;

-- Property images table for storing image metadata
-- Actual image files are stored in Supabase Storage bucket 'property-images'
CREATE TABLE public.property_images (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys for multi-tenant isolation
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Storage location (path in Supabase Storage)
  storage_path TEXT NOT NULL,  -- e.g., 'org_id/properties/property_id/filename.jpg'
  file_name TEXT NOT NULL,      -- Original filename for display

  -- File metadata
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  width INTEGER CHECK (width > 0),
  height INTEGER CHECK (height > 0),

  -- Display organization
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Accessibility
  alt_text TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_storage_path UNIQUE (storage_path),
  CONSTRAINT valid_display_order CHECK (display_order >= 0)
);

-- Add table comment
COMMENT ON TABLE public.property_images IS
'Property images metadata. Actual image files stored in Supabase Storage.
RLS: org isolation, all members can view, admins can manage.';

-- Add column comments
COMMENT ON COLUMN public.property_images.storage_path IS 'Path in Supabase Storage bucket. Format: org_id/properties/property_id/filename.jpg';
COMMENT ON COLUMN public.property_images.file_size IS 'File size in bytes. Maximum 10MB (10485760 bytes).';
COMMENT ON COLUMN public.property_images.mime_type IS 'Only JPEG, PNG, and WebP images allowed.';
COMMENT ON COLUMN public.property_images.display_order IS 'Order for displaying images in gallery. Lower numbers appear first.';
COMMENT ON COLUMN public.property_images.is_primary IS 'Marks the primary/hero image for the property. Only one per property enforced by trigger.';
COMMENT ON COLUMN public.property_images.alt_text IS 'Alternative text for accessibility and SEO.';

-- ============================================================================
-- PART 2: Create Indexes for Performance
-- ============================================================================

-- Index for querying images by property (most common query)
CREATE INDEX idx_property_images_property_id ON public.property_images(property_id);

-- Index for org isolation (RLS performance)
CREATE INDEX idx_property_images_org_id ON public.property_images(org_id);

-- Index for ordered retrieval of images
CREATE INDEX idx_property_images_display_order ON public.property_images(property_id, display_order);

-- Index for finding primary images quickly
CREATE INDEX idx_property_images_primary ON public.property_images(property_id, is_primary) WHERE is_primary = true;

-- Composite index for common query patterns
CREATE INDEX idx_property_images_property_org ON public.property_images(property_id, org_id);

-- ============================================================================
-- PART 3: Create Trigger to Ensure Single Primary Image
-- ============================================================================

-- Function to ensure only one primary image per property
CREATE OR REPLACE FUNCTION public.ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a new primary image, unset all others for this property
  IF NEW.is_primary = true THEN
    UPDATE public.property_images
    SET
      is_primary = false,
      updated_at = NOW()
    WHERE
      property_id = NEW.property_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to maintain single primary image constraint
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_image ON public.property_images;
CREATE TRIGGER trigger_ensure_single_primary_image
  BEFORE INSERT OR UPDATE OF is_primary ON public.property_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.ensure_single_primary_image();

COMMENT ON FUNCTION public.ensure_single_primary_image() IS
'Ensures only one primary image exists per property.
When an image is marked as primary, all other images for that property are unmarked.';

-- ============================================================================
-- PART 4: Create Updated_at Trigger
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_property_images_updated_at ON public.property_images;
CREATE TRIGGER trigger_property_images_updated_at
  BEFORE UPDATE ON public.property_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_images_updated_at();

-- ============================================================================
-- PART 5: Enable Row Level Security
-- ============================================================================

-- Enable RLS on property_images table
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (security best practice)
ALTER TABLE public.property_images FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: Create RLS Policies
-- ============================================================================

-- SELECT: All org members can view property images
CREATE POLICY "property_images_select_org" ON public.property_images
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins/owners can upload images (only for org's properties)
CREATE POLICY "property_images_insert_admin" ON public.property_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND property_id IN (
      SELECT id FROM public.properties WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update image metadata
CREATE POLICY "property_images_update_admin" ON public.property_images
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

-- DELETE: Admins/owners can delete images
CREATE POLICY "property_images_delete_admin" ON public.property_images
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 7: Create Helper Functions
-- ============================================================================

-- Function to get primary image for a property
CREATE OR REPLACE FUNCTION public.get_primary_property_image(target_property_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM public.property_images
    WHERE property_id = target_property_id
      AND is_primary = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_primary_property_image(UUID) IS
'Returns the ID of the primary image for a given property.
Returns NULL if no primary image is set.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_primary_property_image(UUID) TO authenticated;

-- Function to get all images for a property in display order
CREATE OR REPLACE FUNCTION public.get_property_images_ordered(target_property_id UUID)
RETURNS TABLE (
  id UUID,
  storage_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type VARCHAR,
  width INTEGER,
  height INTEGER,
  display_order INTEGER,
  is_primary BOOLEAN,
  alt_text TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.storage_path,
    pi.file_name,
    pi.file_size,
    pi.mime_type,
    pi.width,
    pi.height,
    pi.display_order,
    pi.is_primary,
    pi.alt_text,
    pi.created_at
  FROM public.property_images pi
  WHERE pi.property_id = target_property_id
    AND pi.org_id = public.get_user_org_id()
  ORDER BY pi.display_order ASC, pi.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_property_images_ordered(UUID) IS
'Returns all images for a property ordered by display_order.
Respects RLS policies (only returns images from user''s org).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_property_images_ordered(UUID) TO authenticated;

-- ============================================================================
-- PART 8: Create View for Easy Access
-- ============================================================================

-- View to get properties with their primary image
CREATE OR REPLACE VIEW public.properties_with_primary_image AS
SELECT
  p.*,
  pi.id AS primary_image_id,
  pi.storage_path AS primary_image_path,
  pi.file_name AS primary_image_name,
  pi.alt_text AS primary_image_alt
FROM public.properties p
LEFT JOIN public.property_images pi ON (
  p.id = pi.property_id
  AND pi.is_primary = true
);

COMMENT ON VIEW public.properties_with_primary_image IS
'Properties joined with their primary image for easy querying.
Includes all property fields plus primary image metadata.';

-- ============================================================================
-- PART 9: Grant Permissions
-- ============================================================================

-- Grant select on the view to authenticated users
GRANT SELECT ON public.properties_with_primary_image TO authenticated;

-- ============================================================================
-- PART 10: Testing Queries
-- ============================================================================

-- Uncomment to test after applying migration:
/*
-- Verify table was created with RLS enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'property_images';

-- View all policies for property_images table
SELECT
  policyname,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'property_images'
ORDER BY cmd, policyname;

-- View all indexes on property_images table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'property_images'
ORDER BY indexname;

-- Test inserting an image (requires authenticated user with admin role)
-- INSERT INTO public.property_images (
--   property_id,
--   org_id,
--   storage_path,
--   file_name,
--   file_size,
--   mime_type,
--   display_order,
--   is_primary
-- ) VALUES (
--   'property-uuid-here',
--   'org-uuid-here',
--   'org-uuid/properties/property-uuid/test.jpg',
--   'test.jpg',
--   1024000,
--   'image/jpeg',
--   0,
--   true
-- );

-- Test the primary image constraint (should auto-unset other primary images)
-- SELECT property_id, id, is_primary, file_name
-- FROM public.property_images
-- WHERE property_id = 'property-uuid-here'
-- ORDER BY is_primary DESC, display_order;

-- Test helper functions
-- SELECT public.get_primary_property_image('property-uuid-here');
-- SELECT * FROM public.get_property_images_ordered('property-uuid-here');

-- Test view
-- SELECT * FROM public.properties_with_primary_image LIMIT 5;
*/
