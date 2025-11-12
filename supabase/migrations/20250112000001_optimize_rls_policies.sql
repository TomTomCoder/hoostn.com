-- ============================================================================
-- RLS Optimization Migration
-- Adds helper functions and optimized RLS policies for multi-tenant security
-- ============================================================================

-- ============================================================================
-- PART 1: Helper Functions
-- ============================================================================

-- Get current user's organization ID (cached per statement)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get current user's role (cached per statement)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is admin or owner
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role IN ('owner', 'admin') FROM public.users WHERE id = (SELECT auth.uid()) LIMIT 1),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is owner
CREATE OR REPLACE FUNCTION public.is_org_owner()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'owner' FROM public.users WHERE id = (SELECT auth.uid()) LIMIT 1),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner() TO authenticated;

-- ============================================================================
-- PART 2: Additional Indexes for RLS Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================================================
-- PART 3: Organizations Table Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their org" ON public.organizations;

-- SELECT: View own organization
CREATE POLICY "org_select_own" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_org_id());

-- UPDATE: Only owners can update org details
CREATE POLICY "org_update_owner" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.get_user_org_id() AND public.is_org_owner())
  WITH CHECK (id = public.get_user_org_id() AND public.is_org_owner());

-- ============================================================================
-- PART 4: Users Table Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their profile" ON public.users;

-- SELECT: View own profile and org members
CREATE POLICY "users_select_org_members" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR org_id = public.get_user_org_id()
  );

-- INSERT: Allow during signup
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND org_id = public.get_user_org_id()
  );

-- UPDATE: Owners/admins can update team members
CREATE POLICY "users_update_team_admin" ON public.users
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

-- DELETE: Only owners can remove team members (but not themselves)
CREATE POLICY "users_delete_owner" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_owner()
    AND id != (SELECT auth.uid())
  );

-- ============================================================================
-- PART 5: Properties Table Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their org properties" ON public.properties;

-- SELECT: All org members can view properties
CREATE POLICY "properties_select_org" ON public.properties
  FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

-- INSERT: Only admins/owners can create properties
CREATE POLICY "properties_insert_admin" ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- UPDATE: Only admins/owners can update properties
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_admin())
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());

-- DELETE: Only owners can delete properties
CREATE POLICY "properties_delete_owner" ON public.properties
  FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_owner());

-- ============================================================================
-- PART 6: Lots Table Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their org lots" ON public.lots;

-- SELECT: All org members can view lots
CREATE POLICY "lots_select_org" ON public.lots
  FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

-- INSERT: Admins/owners can create lots
CREATE POLICY "lots_insert_admin" ON public.lots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND property_id IN (
      SELECT id FROM public.properties WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update lots
CREATE POLICY "lots_update_admin" ON public.lots
  FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_admin())
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());

-- DELETE: Only owners can delete lots
CREATE POLICY "lots_delete_owner" ON public.lots
  FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_owner());

-- ============================================================================
-- PART 7: Reservations Table Policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their org reservations" ON public.reservations;

-- SELECT: All org members can view reservations
CREATE POLICY "reservations_select_org" ON public.reservations
  FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

-- INSERT: All authenticated org members can create reservations
CREATE POLICY "reservations_insert_org" ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND lot_id IN (
      SELECT id FROM public.lots WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Admins/owners can update reservations
CREATE POLICY "reservations_update_admin" ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_admin())
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());

-- DELETE: Only owners can delete reservations
CREATE POLICY "reservations_delete_owner" ON public.reservations
  FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_owner());

-- ============================================================================
-- PART 8: Threads Table Policies
-- ============================================================================

-- SELECT: All org members can view threads
CREATE POLICY "threads_select_org" ON public.threads
  FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());

-- INSERT: All org members can create threads
CREATE POLICY "threads_insert_org" ON public.threads
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

-- UPDATE: All org members can update threads
CREATE POLICY "threads_update_org" ON public.threads
  FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

-- DELETE: Only admins/owners can delete threads
CREATE POLICY "threads_delete_admin" ON public.threads
  FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_admin());

-- ============================================================================
-- PART 9: Messages Table Policies
-- ============================================================================

-- SELECT: Can view messages in org threads
CREATE POLICY "messages_select_via_thread" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  );

-- INSERT: Can create messages in org threads
CREATE POLICY "messages_insert_via_thread" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Only authors can update their own messages (within 5 minutes)
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND created_at > NOW() - INTERVAL '5 minutes'
    AND thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  );

-- DELETE: Admins/owners can delete messages
CREATE POLICY "messages_delete_admin" ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 10: AI Traces Table Policies
-- ============================================================================

-- SELECT: Only admins/owners can view AI traces
CREATE POLICY "ai_traces_select_admin" ON public.ai_traces
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 11: Handoffs Table Policies
-- ============================================================================

-- SELECT: All org members can view handoffs
CREATE POLICY "handoffs_select_org" ON public.handoffs
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  );

-- INSERT: All org members can create handoffs
CREATE POLICY "handoffs_insert_org" ON public.handoffs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Assigned user or admins can update handoffs
CREATE POLICY "handoffs_update_assigned" ON public.handoffs
  FOR UPDATE
  TO authenticated
  USING (
    (assigned_to = (SELECT auth.uid()) OR public.is_org_admin())
    AND thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    (assigned_to = (SELECT auth.uid()) OR public.is_org_admin())
    AND thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  );

-- DELETE: Only admins/owners can delete handoffs
CREATE POLICY "handoffs_delete_admin" ON public.handoffs
  FOR DELETE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 12: Verification Query
-- ============================================================================

-- Run this to verify all tables have proper RLS setup
COMMENT ON EXTENSION "uuid-ossp" IS 'RLS optimization migration completed. Run the following query to verify:

SELECT 
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count,
  STRING_AGG(DISTINCT p.cmd::text, '', '') AS operations_covered
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = ''public''
  AND t.tablename IN (''organizations'', ''users'', ''properties'', ''lots'', ''reservations'', ''threads'', ''messages'', ''ai_traces'', ''handoffs'')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
';
