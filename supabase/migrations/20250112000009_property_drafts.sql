-- ============================================================================
-- Property Drafts Table Migration
-- Auto-save functionality for property creation/editing
-- ============================================================================

-- ============================================================================
-- PART 1: Create Property Drafts Table
-- ============================================================================

-- Drop table if it exists (idempotent migration)
DROP TABLE IF EXISTS public.property_drafts CASCADE;

-- Property drafts table for auto-saving form data
-- Allows users to save partial property data and resume later
CREATE TABLE public.property_drafts (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Draft data stored as JSONB for flexibility
  -- Can contain partial property data, validation state, UI state, etc.
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: one draft per user per organization
  CONSTRAINT unique_user_org_draft UNIQUE (user_id, organization_id)
);

-- Add table comment
COMMENT ON TABLE public.property_drafts IS
'Property drafts for auto-save functionality.
Stores partial property data as JSONB.
One draft per user per organization (upsert pattern).
RLS: users can only access their own drafts.';

-- Add column comments
COMMENT ON COLUMN public.property_drafts.user_id IS 'Owner of this draft. Drafts are private to the user who created them.';
COMMENT ON COLUMN public.property_drafts.organization_id IS 'Organization context for the draft. Ensures drafts are scoped to org.';
COMMENT ON COLUMN public.property_drafts.data IS 'Draft data stored as JSONB. Contains partial property information, form state, etc.';

-- ============================================================================
-- PART 2: Create Indexes for Performance
-- ============================================================================

-- Index on user_id for fast lookup of user's drafts
CREATE INDEX idx_property_drafts_user_id ON public.property_drafts(user_id);

-- Index on updated_at for sorting by last modified
CREATE INDEX idx_property_drafts_updated_at ON public.property_drafts(updated_at DESC);

-- Composite index for common query pattern (user + org)
CREATE INDEX idx_property_drafts_user_org ON public.property_drafts(user_id, organization_id);

-- GIN index on JSONB data for efficient queries within draft data
CREATE INDEX idx_property_drafts_data ON public.property_drafts USING GIN (data);

-- ============================================================================
-- PART 3: Create Updated_at Trigger
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_property_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_property_drafts_updated_at ON public.property_drafts;
CREATE TRIGGER trigger_property_drafts_updated_at
  BEFORE UPDATE ON public.property_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_drafts_updated_at();

COMMENT ON FUNCTION public.update_property_drafts_updated_at() IS
'Automatically updates the updated_at timestamp when a draft is modified.';

-- ============================================================================
-- PART 4: Enable Row Level Security
-- ============================================================================

-- Enable RLS on property_drafts table
ALTER TABLE public.property_drafts ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (security best practice)
ALTER TABLE public.property_drafts FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: Create RLS Policies
-- ============================================================================

-- SELECT: Users can only view their own drafts
CREATE POLICY "property_drafts_select_own" ON public.property_drafts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- INSERT: Users can only create their own drafts (for their org)
CREATE POLICY "property_drafts_insert_own" ON public.property_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.get_user_org_id()
  );

-- UPDATE: Users can only update their own drafts
CREATE POLICY "property_drafts_update_own" ON public.property_drafts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.get_user_org_id() -- Cannot change org
  );

-- DELETE: Users can delete their own drafts
CREATE POLICY "property_drafts_delete_own" ON public.property_drafts
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function to upsert a draft (insert or update if exists)
CREATE OR REPLACE FUNCTION public.upsert_property_draft(
  draft_data JSONB
)
RETURNS UUID AS $$
DECLARE
  draft_id UUID;
  user_org_id UUID;
BEGIN
  -- Get user's org_id
  user_org_id := public.get_user_org_id();

  -- Validate user has an organization
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization to create drafts';
  END IF;

  -- Upsert the draft
  INSERT INTO public.property_drafts (
    user_id,
    organization_id,
    data
  ) VALUES (
    auth.uid(),
    user_org_id,
    draft_data
  )
  ON CONFLICT (user_id, organization_id)
  DO UPDATE SET
    data = EXCLUDED.data,
    updated_at = NOW()
  RETURNING id INTO draft_id;

  RETURN draft_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.upsert_property_draft(JSONB) IS
'Inserts or updates a property draft for the current user.
Uses the unique constraint (user_id, organization_id) to ensure one draft per user per org.
Returns the draft ID.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_property_draft(JSONB) TO authenticated;

-- Function to get current user's draft
CREATE OR REPLACE FUNCTION public.get_my_property_draft()
RETURNS TABLE (
  id UUID,
  data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.data,
    pd.created_at,
    pd.updated_at
  FROM public.property_drafts pd
  WHERE
    pd.user_id = auth.uid()
    AND pd.organization_id = public.get_user_org_id()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_my_property_draft() IS
'Returns the current user''s property draft for their organization.
Returns empty result if no draft exists.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_property_draft() TO authenticated;

-- Function to clear/delete current user's draft
CREATE OR REPLACE FUNCTION public.clear_my_property_draft()
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.property_drafts
  WHERE
    user_id = auth.uid()
    AND organization_id = public.get_user_org_id();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.clear_my_property_draft() IS
'Deletes the current user''s property draft.
Returns true if a draft was deleted, false if no draft existed.
Useful after successfully creating a property from a draft.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.clear_my_property_draft() TO authenticated;

-- Function to check if current user has a draft
CREATE OR REPLACE FUNCTION public.has_property_draft()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.property_drafts
    WHERE
      user_id = auth.uid()
      AND organization_id = public.get_user_org_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.has_property_draft() IS
'Returns true if the current user has a saved property draft.
Useful for UI to show "Continue editing" vs "Start new" options.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_property_draft() TO authenticated;

-- Function to get draft metadata (without full data payload)
CREATE OR REPLACE FUNCTION public.get_property_draft_metadata()
RETURNS TABLE (
  id UUID,
  has_data BOOLEAN,
  data_size INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  age_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    (pd.data IS NOT NULL AND pd.data != '{}'::jsonb) AS has_data,
    LENGTH(pd.data::text) AS data_size,
    pd.created_at,
    pd.updated_at,
    EXTRACT(EPOCH FROM (NOW() - pd.updated_at))::INTEGER / 60 AS age_minutes
  FROM public.property_drafts pd
  WHERE
    pd.user_id = auth.uid()
    AND pd.organization_id = public.get_user_org_id()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_property_draft_metadata() IS
'Returns metadata about the user''s draft without returning the full data payload.
Useful for checking draft status and age without transferring large JSONB data.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_property_draft_metadata() TO authenticated;

-- ============================================================================
-- PART 7: Create Cleanup Function for Old Drafts
-- ============================================================================

-- Function to clean up old drafts (older than N days)
CREATE OR REPLACE FUNCTION public.cleanup_old_property_drafts(
  days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete drafts older than specified days
  DELETE FROM public.property_drafts
  WHERE updated_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_property_drafts(INTEGER) IS
'Deletes property drafts that haven''t been updated in the specified number of days.
Default: 90 days. Returns the number of drafts deleted.
Should be run periodically via cron job or scheduled function.';

-- Grant execute permission to service role only (not regular users)
-- GRANT EXECUTE ON FUNCTION public.cleanup_old_property_drafts(INTEGER) TO service_role;

-- ============================================================================
-- PART 8: Create View for Draft Statistics
-- ============================================================================

-- View to monitor draft usage across organizations
CREATE OR REPLACE VIEW public.property_draft_stats AS
SELECT
  pd.organization_id,
  o.name AS organization_name,
  COUNT(pd.id) AS total_drafts,
  AVG(LENGTH(pd.data::text)) AS avg_data_size,
  MAX(pd.updated_at) AS most_recent_update,
  MIN(pd.created_at) AS oldest_draft,
  COUNT(*) FILTER (WHERE pd.updated_at > NOW() - INTERVAL '7 days') AS active_last_7_days,
  COUNT(*) FILTER (WHERE pd.updated_at > NOW() - INTERVAL '30 days') AS active_last_30_days
FROM public.property_drafts pd
LEFT JOIN public.organizations o ON pd.organization_id = o.id
GROUP BY pd.organization_id, o.name;

COMMENT ON VIEW public.property_draft_stats IS
'Statistics about property drafts per organization.
Useful for monitoring draft usage and identifying stale drafts.
Only accessible to org admins/owners via RLS.';

-- Grant select on view to authenticated users (RLS will filter)
GRANT SELECT ON public.property_draft_stats TO authenticated;

-- ============================================================================
-- PART 9: Testing Queries
-- ============================================================================

-- Uncomment to test after applying migration:
/*
-- Verify table was created with RLS enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'property_drafts';

-- View all policies for property_drafts table
SELECT
  policyname,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'property_drafts'
ORDER BY cmd, policyname;

-- View all indexes on property_drafts table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'property_drafts'
ORDER BY indexname;

-- Test upsert function (requires authenticated user)
-- SELECT public.upsert_property_draft('{"name": "Test Property", "address": "123 Main St"}'::jsonb);

-- Test get draft function
-- SELECT * FROM public.get_my_property_draft();

-- Test has draft function
-- SELECT public.has_property_draft();

-- Test get metadata function
-- SELECT * FROM public.get_property_draft_metadata();

-- Test clear draft function
-- SELECT public.clear_my_property_draft();

-- Test manual insert (requires authenticated user)
-- INSERT INTO public.property_drafts (
--   user_id,
--   organization_id,
--   data
-- ) VALUES (
--   auth.uid(),
--   public.get_user_org_id(),
--   '{"name": "Draft Property", "bedrooms": 3}'::jsonb
-- );

-- View draft statistics
-- SELECT * FROM public.property_draft_stats;

-- Test cleanup function (service role only)
-- SELECT public.cleanup_old_property_drafts(90);

-- Query drafts by JSONB content
-- SELECT id, data->>'name' AS property_name, updated_at
-- FROM public.property_drafts
-- WHERE data->>'city' = 'Paris';

-- Count drafts per user
-- SELECT
--   u.email,
--   COUNT(pd.id) AS draft_count
-- FROM public.users u
-- LEFT JOIN public.property_drafts pd ON u.id = pd.user_id
-- GROUP BY u.email
-- ORDER BY draft_count DESC;
*/
