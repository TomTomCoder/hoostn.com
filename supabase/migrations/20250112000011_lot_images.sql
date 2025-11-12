-- ============================================================================
-- Lot Images Table Migration
-- Storage layer for lot image metadata and organization
-- ============================================================================

-- ============================================================================
-- PART 1: Create Lot Images Table
-- ============================================================================

-- Drop table if it exists (idempotent migration)
DROP TABLE IF EXISTS public.lot_images CASCADE;

-- Lot images table for storing image metadata
-- Actual image files are stored in Supabase Storage bucket 'lot-images'
CREATE TABLE public.lot_images (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys for multi-tenant isolation
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Storage location (path in Supabase Storage)
  storage_path TEXT NOT NULL,  -- e.g., 'org_id/lots/lot_id/filename.jpg'
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
  CONSTRAINT unique_lot_storage_path UNIQUE (storage_path),
  CONSTRAINT valid_lot_display_order CHECK (display_order >= 0)
);

-- Add table comment
COMMENT ON TABLE public.lot_images IS
'Lot images metadata. Actual image files stored in Supabase Storage.
RLS: org isolation, all members can view, admins can manage.';

-- Add column comments
COMMENT ON COLUMN public.lot_images.storage_path IS 'Path in Supabase Storage bucket. Format: org_id/lots/lot_id/filename.jpg';
COMMENT ON COLUMN public.lot_images.file_size IS 'File size in bytes. Maximum 10MB (10485760 bytes).';
COMMENT ON COLUMN public.lot_images.mime_type IS 'Only JPEG, PNG, and WebP images allowed.';
COMMENT ON COLUMN public.lot_images.display_order IS 'Order for displaying images in gallery. Lower numbers appear first.';
COMMENT ON COLUMN public.lot_images.is_primary IS 'Marks the primary/hero image for the lot. Only one per lot enforced by trigger.';
COMMENT ON COLUMN public.lot_images.alt_text IS 'Alternative text for accessibility and SEO.';

-- ============================================================================
-- PART 2: Create Indexes for Performance
-- ============================================================================

-- Index for querying images by lot (most common query)
CREATE INDEX idx_lot_images_lot_id ON public.lot_images(lot_id);

-- Index for org isolation (RLS performance)
CREATE INDEX idx_lot_images_org_id ON public.lot_images(org_id);

-- Index for ordered retrieval of images
CREATE INDEX idx_lot_images_display_order ON public.lot_images(lot_id, display_order);

-- Index for finding primary images quickly
CREATE INDEX idx_lot_images_primary ON public.lot_images(lot_id, is_primary) WHERE is_primary = true;

-- Composite index for common query patterns
CREATE INDEX idx_lot_images_lot_org ON public.lot_images(lot_id, org_id);

-- ============================================================================
-- PART 3: Create Trigger to Ensure Single Primary Image
-- ============================================================================

-- Function to ensure only one primary image per lot
CREATE OR REPLACE FUNCTION public.ensure_single_primary_lot_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a new primary image, unset all others for this lot
  IF NEW.is_primary = true THEN
    UPDATE public.lot_images
    SET
      is_primary = false,
      updated_at = NOW()
    WHERE
      lot_id = NEW.lot_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to maintain single primary image constraint
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_lot_image ON public.lot_images;
CREATE TRIGGER trigger_ensure_single_primary_lot_image
  BEFORE INSERT OR UPDATE OF is_primary ON public.lot_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.ensure_single_primary_lot_image();

COMMENT ON FUNCTION public.ensure_single_primary_lot_image() IS
'Ensures only one primary image exists per lot.
When an image is marked as primary, all other images for that lot are unmarked.';

-- ============================================================================
-- PART 4: Create Updated_at Trigger
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lot_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_lot_images_updated_at ON public.lot_images;
CREATE TRIGGER trigger_lot_images_updated_at
  BEFORE UPDATE ON public.lot_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lot_images_updated_at();

-- ============================================================================
-- PART 5: Enable Row Level Security
-- ============================================================================

-- Enable RLS on lot_images table
ALTER TABLE public.lot_images ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (security best practice)
ALTER TABLE public.lot_images FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: Create RLS Policies
-- ============================================================================

-- SELECT: All org members can view lot images
CREATE POLICY "lot_images_select_org" ON public.lot_images
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins/owners can upload images (only for org's lots)
CREATE POLICY "lot_images_insert_admin" ON public.lot_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND lot_id IN (
      SELECT id FROM public.lots WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update image metadata
CREATE POLICY "lot_images_update_admin" ON public.lot_images
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
CREATE POLICY "lot_images_delete_admin" ON public.lot_images
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 7: Create Helper Functions
-- ============================================================================

-- Function to get primary image for a lot
CREATE OR REPLACE FUNCTION public.get_primary_lot_image(target_lot_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM public.lot_images
    WHERE lot_id = target_lot_id
      AND is_primary = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_primary_lot_image(UUID) IS
'Returns the ID of the primary image for a given lot.
Returns NULL if no primary image is set.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_primary_lot_image(UUID) TO authenticated;

-- Function to get all images for a lot in display order
CREATE OR REPLACE FUNCTION public.get_lot_images_ordered(target_lot_id UUID)
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
    li.id,
    li.storage_path,
    li.file_name,
    li.file_size,
    li.mime_type,
    li.width,
    li.height,
    li.display_order,
    li.is_primary,
    li.alt_text,
    li.created_at
  FROM public.lot_images li
  WHERE li.lot_id = target_lot_id
    AND li.org_id = public.get_user_org_id()
  ORDER BY li.display_order ASC, li.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_lot_images_ordered(UUID) IS
'Returns all images for a lot ordered by display_order.
Respects RLS policies (only returns images from user''s org).';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lot_images_ordered(UUID) TO authenticated;

-- ============================================================================
-- PART 8: Create View for Easy Access
-- ============================================================================

-- View to get lots with their primary image
CREATE OR REPLACE VIEW public.lots_with_primary_image AS
SELECT
  l.*,
  li.id AS primary_image_id,
  li.storage_path AS primary_image_path,
  li.file_name AS primary_image_name,
  li.alt_text AS primary_image_alt
FROM public.lots l
LEFT JOIN public.lot_images li ON (
  l.id = li.lot_id
  AND li.is_primary = true
);

COMMENT ON VIEW public.lots_with_primary_image IS
'Lots joined with their primary image for easy querying.
Includes all lot fields plus primary image metadata.';

-- ============================================================================
-- PART 9: Grant Permissions
-- ============================================================================

-- Grant select on the view to authenticated users
GRANT SELECT ON public.lots_with_primary_image TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
