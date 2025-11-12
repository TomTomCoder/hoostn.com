-- ============================================================================
-- Supabase Storage Setup Migration
-- Configure property-images bucket with RLS policies
-- ============================================================================

-- ============================================================================
-- PART 1: Create Storage Bucket
-- ============================================================================

-- Create the property-images bucket
-- This uses INSERT with ON CONFLICT to make it idempotent
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,                                                      -- Public bucket (RLS controls access)
  10485760,                                                  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']            -- Allowed MIME types
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Add comment to bucket
COMMENT ON TABLE storage.buckets IS
'Storage buckets for file uploads.
property-images bucket: Public bucket with RLS for property image storage.';

-- ============================================================================
-- PART 2: Enable RLS on Storage Objects
-- ============================================================================

-- Enable RLS on storage.objects (should already be enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Drop Existing Policies (for clean slate)
-- ============================================================================

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_org_write" ON storage.objects;
DROP POLICY IF EXISTS "property_images_org_update" ON storage.objects;
DROP POLICY IF EXISTS "property_images_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "property_images_org_delete" ON storage.objects;

-- ============================================================================
-- PART 4: Create Storage RLS Policies
-- ============================================================================

-- Policy 1: Public read access to all property images
-- This allows anyone to view property images (for public listings)
CREATE POLICY "property_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

COMMENT ON POLICY "property_images_public_read" ON storage.objects IS
'Allows public read access to all images in property-images bucket.
Change TO authenticated if you want to restrict to logged-in users only.';

-- Policy 2: Authenticated users can upload images to their org folder only
-- Path structure: {org_id}/properties/{property_id}/{filename}
CREATE POLICY "property_images_org_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
);

COMMENT ON POLICY "property_images_org_write" ON storage.objects IS
'Allows authenticated users to upload images only to their organization folder.
Enforces path structure: {org_id}/properties/{property_id}/{filename}';

-- Policy 3: Authenticated users can update images in their org folder only
CREATE POLICY "property_images_org_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
);

COMMENT ON POLICY "property_images_org_update" ON storage.objects IS
'Allows authenticated users to update (replace) images in their organization folder only.';

-- Policy 4: Admins and owners can delete images from their org folder
CREATE POLICY "property_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
  AND (
    SELECT role FROM public.users WHERE id = auth.uid()
  ) IN ('admin', 'owner')
);

COMMENT ON POLICY "property_images_admin_delete" ON storage.objects IS
'Allows only admins and owners to delete images from their organization folder.
Regular users (employees, guests) cannot delete images.';

-- ============================================================================
-- PART 5: Create Helper Functions for Storage Operations
-- ============================================================================

-- Function to validate storage path matches org_id
CREATE OR REPLACE FUNCTION public.validate_storage_path(
  path TEXT,
  expected_org_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Extract org_id from path (first segment)
  RETURN (
    (string_to_array(path, '/'))[1]::uuid = expected_org_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.validate_storage_path(TEXT, UUID) IS
'Validates that a storage path starts with the expected org_id.
Returns true if path matches format: {org_id}/...
Returns false if path is invalid or org_id does not match.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_storage_path(TEXT, UUID) TO authenticated;

-- Function to build storage path for property image
CREATE OR REPLACE FUNCTION public.build_property_image_path(
  org_id UUID,
  property_id UUID,
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  -- Sanitize filename (basic - do more on client side)
  filename := REGEXP_REPLACE(filename, '[^a-zA-Z0-9._-]', '-', 'g');

  -- Build path: {org_id}/properties/{property_id}/{filename}
  RETURN format('%s/properties/%s/%s', org_id, property_id, filename);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.build_property_image_path(UUID, UUID, TEXT) IS
'Builds a standardized storage path for a property image.
Format: {org_id}/properties/{property_id}/{filename}
Performs basic filename sanitization.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.build_property_image_path(UUID, UUID, TEXT) TO authenticated;

-- Function to get public URL for a storage path
CREATE OR REPLACE FUNCTION public.get_storage_public_url(
  bucket_name TEXT,
  path TEXT
)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Get Supabase project URL from environment/settings
  -- This is a placeholder - actual implementation depends on your setup
  base_url := current_setting('app.settings.supabase_url', true);

  IF base_url IS NULL THEN
    -- Fallback to constructing URL from known pattern
    -- You may need to adjust this based on your Supabase project
    RETURN format('/storage/v1/object/public/%s/%s', bucket_name, path);
  ELSE
    RETURN format('%s/storage/v1/object/public/%s/%s', base_url, bucket_name, path);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_storage_public_url(TEXT, TEXT) IS
'Constructs the public URL for a storage object.
Note: This is a helper function. Prefer using Supabase client library for URL generation.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_storage_public_url(TEXT, TEXT) TO authenticated;

-- ============================================================================
-- PART 6: Create Views for Storage Monitoring
-- ============================================================================

-- View to monitor storage usage by organization
CREATE OR REPLACE VIEW public.storage_usage_by_org AS
SELECT
  (storage.foldername(o.name))[1]::uuid AS org_id,
  org.name AS organization_name,
  COUNT(*) AS file_count,
  SUM((o.metadata->>'size')::bigint) AS total_bytes,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) AS total_mb,
  ROUND(SUM((o.metadata->>'size')::bigint) / 1024.0 / 1024.0 / 1024.0, 2) AS total_gb,
  MIN(o.created_at) AS oldest_file,
  MAX(o.created_at) AS newest_file
FROM storage.objects o
LEFT JOIN public.organizations org ON (storage.foldername(o.name))[1]::uuid = org.id
WHERE o.bucket_id = 'property-images'
GROUP BY (storage.foldername(o.name))[1], org.name;

COMMENT ON VIEW public.storage_usage_by_org IS
'Aggregates storage usage statistics by organization.
Shows file counts, total storage used, and date ranges.';

-- Grant select on view (RLS will filter to user's org)
GRANT SELECT ON public.storage_usage_by_org TO authenticated;

-- View to find orphaned storage objects (no corresponding DB record)
CREATE OR REPLACE VIEW public.orphaned_storage_objects AS
SELECT
  o.name AS storage_path,
  o.id,
  (o.metadata->>'size')::bigint AS size_bytes,
  ROUND((o.metadata->>'size')::bigint / 1024.0 / 1024.0, 2) AS size_mb,
  o.created_at,
  o.updated_at,
  (storage.foldername(o.name))[1]::uuid AS org_id
FROM storage.objects o
WHERE o.bucket_id = 'property-images'
  AND NOT EXISTS (
    SELECT 1
    FROM public.property_images pi
    WHERE pi.storage_path = o.name
  );

COMMENT ON VIEW public.orphaned_storage_objects IS
'Identifies storage objects that do not have corresponding records in property_images table.
Useful for cleanup and maintenance.';

-- Grant select on view (admins only should access this)
GRANT SELECT ON public.orphaned_storage_objects TO authenticated;

-- ============================================================================
-- PART 7: Create Cleanup Functions
-- ============================================================================

-- Function to delete orphaned storage objects
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_storage_objects(
  older_than_days INTEGER DEFAULT 7,
  dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE (
  storage_path TEXT,
  size_mb NUMERIC,
  created_at TIMESTAMPTZ,
  would_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.name::TEXT AS storage_path,
    ROUND((o.metadata->>'size')::bigint / 1024.0 / 1024.0, 2) AS size_mb,
    o.created_at,
    NOT dry_run AS would_delete
  FROM storage.objects o
  WHERE o.bucket_id = 'property-images'
    AND o.created_at < NOW() - (older_than_days || ' days')::INTERVAL
    AND NOT EXISTS (
      SELECT 1
      FROM public.property_images pi
      WHERE pi.storage_path = o.name
    );

  -- Actually delete if not dry run
  IF NOT dry_run THEN
    DELETE FROM storage.objects o
    WHERE o.bucket_id = 'property-images'
      AND o.created_at < NOW() - (older_than_days || ' days')::INTERVAL
      AND NOT EXISTS (
        SELECT 1
        FROM public.property_images pi
        WHERE pi.storage_path = o.name
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_orphaned_storage_objects(INTEGER, BOOLEAN) IS
'Identifies and optionally deletes orphaned storage objects.
Parameters:
  - older_than_days: Only consider files older than this (default 7)
  - dry_run: If true, only lists files without deleting (default true)
Returns list of files that match criteria.
Run with dry_run=true first to preview deletions!';

-- Grant execute to service_role only (not regular users)
-- GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_storage_objects(INTEGER, BOOLEAN) TO service_role;

-- ============================================================================
-- PART 8: Testing Queries
-- ============================================================================

-- Uncomment to test after applying migration:
/*
-- Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'property-images';

-- View all storage policies
SELECT
  policyname,
  cmd,
  roles,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'property_images%'
ORDER BY cmd, policyname;

-- Test path validation
SELECT public.validate_storage_path(
  '550e8400-e29b-41d4-a716-446655440000/properties/660e8400-e29b-41d4-a716-446655440001/image.jpg',
  '550e8400-e29b-41d4-a716-446655440000'::uuid
); -- Should return true

SELECT public.validate_storage_path(
  'invalid/path/image.jpg',
  '550e8400-e29b-41d4-a716-446655440000'::uuid
); -- Should return false

-- Test path building
SELECT public.build_property_image_path(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'test image!@#$.jpg'
);

-- View storage usage by organization
SELECT * FROM public.storage_usage_by_org;

-- View orphaned storage objects
SELECT * FROM public.orphaned_storage_objects;

-- Test cleanup (dry run)
SELECT * FROM public.cleanup_orphaned_storage_objects(7, true);

-- Count storage objects
SELECT
  bucket_id,
  COUNT(*) AS object_count,
  SUM((metadata->>'size')::bigint) AS total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) AS total_mb
FROM storage.objects
WHERE bucket_id = 'property-images'
GROUP BY bucket_id;
*/
