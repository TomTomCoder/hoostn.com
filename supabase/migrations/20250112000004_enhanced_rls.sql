-- ============================================================================
-- Enhanced RLS Policies Migration
-- Comprehensive, optimized Row Level Security policies for all tables
-- ============================================================================

-- ============================================================================
-- PART 1: Drop All Existing Policies (for clean slate)
-- ============================================================================

-- Organizations
DROP POLICY IF EXISTS "Users can view their org" ON public.organizations;
DROP POLICY IF EXISTS "org_select_own" ON public.organizations;
DROP POLICY IF EXISTS "org_update_owner" ON public.organizations;

-- Users
DROP POLICY IF EXISTS "Users can view their profile" ON public.users;
DROP POLICY IF EXISTS "users_select_org_members" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_team_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_owner" ON public.users;

-- Properties
DROP POLICY IF EXISTS "Users can view their org properties" ON public.properties;
DROP POLICY IF EXISTS "properties_select_org" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_update_admin" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_owner" ON public.properties;

-- Lots
DROP POLICY IF EXISTS "Users can manage their org lots" ON public.lots;
DROP POLICY IF EXISTS "lots_select_org" ON public.lots;
DROP POLICY IF EXISTS "lots_insert_admin" ON public.lots;
DROP POLICY IF EXISTS "lots_update_admin" ON public.lots;
DROP POLICY IF EXISTS "lots_delete_owner" ON public.lots;

-- Reservations
DROP POLICY IF EXISTS "Users can view their org reservations" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select_org" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert_org" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update_admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations_delete_owner" ON public.reservations;

-- Threads
DROP POLICY IF EXISTS "threads_select_org" ON public.threads;
DROP POLICY IF EXISTS "threads_insert_org" ON public.threads;
DROP POLICY IF EXISTS "threads_update_org" ON public.threads;
DROP POLICY IF EXISTS "threads_delete_admin" ON public.threads;

-- Messages
DROP POLICY IF EXISTS "messages_select_via_thread" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_via_thread" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_admin" ON public.messages;

-- AI Traces
DROP POLICY IF EXISTS "ai_traces_select_admin" ON public.ai_traces;

-- Handoffs
DROP POLICY IF EXISTS "handoffs_select_org" ON public.handoffs;
DROP POLICY IF EXISTS "handoffs_insert_org" ON public.handoffs;
DROP POLICY IF EXISTS "handoffs_update_assigned" ON public.handoffs;
DROP POLICY IF EXISTS "handoffs_delete_admin" ON public.handoffs;

-- ============================================================================
-- PART 2: Organizations Table Policies
-- ============================================================================

-- SELECT: Users can view their own organization
CREATE POLICY "org_select_own" ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = public.get_user_org_id()
  );

-- UPDATE: Only owners can update organization details
CREATE POLICY "org_update_owner" ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = public.get_user_org_id()
    AND public.is_org_owner()
  )
  WITH CHECK (
    id = public.get_user_org_id()
    AND public.is_org_owner()
  );

-- DELETE: Only owners can delete organization (dangerous operation)
CREATE POLICY "org_delete_owner" ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    id = public.get_user_org_id()
    AND public.is_org_owner()
  );

-- ============================================================================
-- PART 3: Users Table Policies
-- ============================================================================

-- SELECT: Users can view their own profile and org members
CREATE POLICY "users_select_org_members" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() -- Own profile
    OR org_id = public.get_user_org_id() -- Org members
  );

-- INSERT: Allow user profile creation during signup
-- This is called by the trigger, but also allows invited users
CREATE POLICY "users_insert_signup" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() -- Can only create profile for self
  );

-- UPDATE: Users can update their own profile (limited fields)
CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid()
    AND org_id = public.get_user_org_id() -- Cannot change org
    AND role = (SELECT role FROM public.users WHERE id = auth.uid()) -- Cannot change own role
  );

-- UPDATE: Admins/owners can manage team members
CREATE POLICY "users_update_team_members" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
    AND id != auth.uid() -- Cannot modify self via this policy
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- DELETE: Only owners can remove team members (cannot remove self)
CREATE POLICY "users_delete_team_members" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_owner()
    AND id != auth.uid() -- Cannot delete self
  );

-- ============================================================================
-- PART 4: Properties Table Policies
-- ============================================================================

-- SELECT: All org members can view properties
CREATE POLICY "properties_select_org" ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins and owners can create properties
CREATE POLICY "properties_insert_admin" ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- UPDATE: Admins and owners can update properties
CREATE POLICY "properties_update_admin" ON public.properties
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

-- DELETE: Only owners can delete properties
CREATE POLICY "properties_delete_owner" ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_owner()
  );

-- ============================================================================
-- PART 5: Lots Table Policies
-- ============================================================================

-- SELECT: All org members can view lots
CREATE POLICY "lots_select_org" ON public.lots
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: Admins/owners can create lots (only for org's properties)
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
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- DELETE: Only owners can delete lots
CREATE POLICY "lots_delete_owner" ON public.lots
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_owner()
  );

-- ============================================================================
-- PART 6: Reservations Table Policies
-- ============================================================================

-- SELECT: All org members can view reservations
CREATE POLICY "reservations_select_org" ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: All org members can create reservations (for org's lots only)
CREATE POLICY "reservations_insert_org" ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND lot_id IN (
      SELECT id FROM public.lots WHERE org_id = public.get_user_org_id()
    )
  );

-- UPDATE: All org members can update reservations
CREATE POLICY "reservations_update_org" ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
  );

-- DELETE: Only admins/owners can delete reservations
CREATE POLICY "reservations_delete_admin" ON public.reservations
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 7: Threads Table Policies
-- ============================================================================

-- SELECT: All org members can view threads
CREATE POLICY "threads_select_org" ON public.threads
  FOR SELECT
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  );

-- INSERT: All org members can create threads
CREATE POLICY "threads_insert_org" ON public.threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND (
      -- If linked to a reservation, ensure reservation belongs to org
      reservation_id IS NULL
      OR reservation_id IN (
        SELECT id FROM public.reservations WHERE org_id = public.get_user_org_id()
      )
    )
  );

-- UPDATE: All org members can update threads
CREATE POLICY "threads_update_org" ON public.threads
  FOR UPDATE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
  )
  WITH CHECK (
    org_id = public.get_user_org_id()
  );

-- DELETE: Only admins/owners can delete threads
CREATE POLICY "threads_delete_admin" ON public.threads
  FOR DELETE
  TO authenticated
  USING (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );

-- ============================================================================
-- PART 8: Messages Table Policies (Cascading Security via Threads)
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

-- UPDATE: Authors can update their own messages (within 15 minutes)
CREATE POLICY "messages_update_own_recent" ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    author_type = 'out' -- Only outgoing messages (from staff)
    AND author_id = auth.uid()
    AND created_at > NOW() - INTERVAL '15 minutes'
    AND thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    author_id = auth.uid()
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
-- PART 9: AI Traces Table Policies (Admin/Owner Only)
-- ============================================================================

-- SELECT: Only admins/owners can view AI traces (monitoring/debugging)
CREATE POLICY "ai_traces_select_admin" ON public.ai_traces
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND public.is_org_admin()
  );

-- INSERT: AI system can insert traces (via service role)
-- No policy needed for INSERT - handled by service role

-- DELETE: Only owners can delete traces (cleanup old data)
CREATE POLICY "ai_traces_delete_owner" ON public.ai_traces
  FOR DELETE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND public.is_org_owner()
  );

-- ============================================================================
-- PART 10: Handoffs Table Policies (HITL Escalations)
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

-- INSERT: All org members can create handoffs (escalate to human)
CREATE POLICY "handoffs_insert_org" ON public.handoffs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND (
      -- If assigned to someone, ensure they're in the org
      assigned_to IS NULL
      OR assigned_to IN (
        SELECT id FROM public.users WHERE org_id = public.get_user_org_id()
      )
    )
  );

-- UPDATE: Assigned user or admins can update handoffs
CREATE POLICY "handoffs_update_assigned" ON public.handoffs
  FOR UPDATE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND (
      assigned_to = auth.uid() -- Assigned user
      OR public.is_org_admin() -- Or admin/owner
    )
  )
  WITH CHECK (
    thread_id IN (
      SELECT id FROM public.threads WHERE org_id = public.get_user_org_id()
    )
    AND (
      assigned_to = auth.uid()
      OR public.is_org_admin()
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
-- PART 11: Verification
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Organizations (multi-tenant). RLS: users can only access their own org.';
COMMENT ON TABLE public.users IS 'User profiles. RLS: users can view org members, update own profile, admins can manage team.';
COMMENT ON TABLE public.properties IS 'Properties. RLS: org isolation, admins can manage, owners can delete.';
COMMENT ON TABLE public.lots IS 'Lots/Units. RLS: org isolation, admins can manage, owners can delete.';
COMMENT ON TABLE public.reservations IS 'Reservations. RLS: org isolation, all members can manage, admins can delete.';
COMMENT ON TABLE public.threads IS 'Message threads. RLS: org isolation, all members can manage, admins can delete.';
COMMENT ON TABLE public.messages IS 'Messages. RLS: cascading via threads, authors can edit recent, admins can delete.';
COMMENT ON TABLE public.ai_traces IS 'AI monitoring traces. RLS: admins only can view, owners can delete.';
COMMENT ON TABLE public.handoffs IS 'HITL escalations. RLS: all members can view/create, assigned or admins can update.';

-- Create a view to verify all policies
CREATE OR REPLACE VIEW public.rls_policy_coverage AS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

COMMENT ON VIEW public.rls_policy_coverage IS
'View to audit RLS policy coverage across all tables.
Run: SELECT tablename, COUNT(*) as policy_count, STRING_AGG(cmd::text, '', '') as ops_covered FROM public.rls_policy_coverage GROUP BY tablename ORDER BY tablename;';

-- ============================================================================
-- PART 12: Testing Queries
-- ============================================================================

-- Uncomment to test RLS policies after applying migration:
/*
-- Verify all tables have RLS enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'users', 'properties', 'lots', 'reservations', 'threads', 'messages', 'ai_traces', 'handoffs')
ORDER BY tablename;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) AS policy_count,
  STRING_AGG(DISTINCT cmd::text, ', ') AS operations_covered
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- View all policies for a specific table
SELECT * FROM public.rls_policy_coverage WHERE tablename = 'properties';

-- Test org isolation (should only return current user's org data)
SELECT * FROM public.organizations;
SELECT * FROM public.properties;
SELECT * FROM public.reservations;
*/
