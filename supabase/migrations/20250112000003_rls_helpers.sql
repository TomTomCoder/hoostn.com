-- ============================================================================
-- RLS Helper Functions Migration
-- Optimized helper functions for Row Level Security policies
-- ============================================================================

-- ============================================================================
-- PART 1: Core Helper Functions (JWT-based for performance)
-- ============================================================================

-- Get current user's organization ID from JWT claims (FAST - cached per statement)
-- This reads directly from the JWT token's app_metadata, avoiding database lookups
-- Performance: ~0.1ms vs ~10ms for database query
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
BEGIN
  -- Try to get org_id from JWT app_metadata first (fastest)
  RETURN NULLIF(
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'org_id',
    ''
  )::UUID;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to database lookup if JWT parsing fails
    RETURN (
      SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get current user's role from JWT claims (FAST - cached per statement)
-- Performance: ~0.1ms vs ~10ms for database query
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Try to get role from JWT app_metadata first
  DECLARE
    jwt_role TEXT;
  BEGIN
    jwt_role := current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
    IF jwt_role IS NOT NULL AND jwt_role != '' THEN
      RETURN jwt_role;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL; -- Continue to fallback
  END;

  -- Fallback to database lookup
  RETURN (
    SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 2: Role Checking Functions
-- ============================================================================

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION public.check_user_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    public.get_user_role() = required_role,
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user has required role or higher
-- Role hierarchy: owner > admin > employee > guest
CREATE OR REPLACE FUNCTION public.has_role_or_higher(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_level INT;
  required_level INT;
BEGIN
  user_role := public.get_user_role();

  -- Map roles to levels
  role_level := CASE user_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'employee' THEN 2
    WHEN 'guest' THEN 1
    ELSE 0
  END;

  required_level := CASE required_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'employee' THEN 2
    WHEN 'guest' THEN 1
    ELSE 0
  END;

  RETURN role_level >= required_level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is owner
CREATE OR REPLACE FUNCTION public.is_org_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    public.get_user_role() = 'owner',
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is admin or owner
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    public.get_user_role() IN ('owner', 'admin'),
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 3: Organization Access Functions
-- ============================================================================

-- Check if current user has access to a specific organization
CREATE OR REPLACE FUNCTION public.has_org_access(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User has access if target_org_id matches their org
  RETURN COALESCE(
    public.get_user_org_id() = target_org_id,
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user can manage a specific resource
-- (i.e., resource belongs to their org AND they have admin rights)
CREATE OR REPLACE FUNCTION public.can_manage_resource(resource_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    public.get_user_org_id() = resource_org_id AND public.is_org_admin(),
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 4: Thread/Message Access Functions (for cascading security)
-- ============================================================================

-- Check if user can access a thread (via org_id)
CREATE OR REPLACE FUNCTION public.can_access_thread(thread_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.threads
    WHERE id = thread_id
      AND org_id = public.get_user_org_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user can access a message (via thread's org_id)
CREATE OR REPLACE FUNCTION public.can_access_message(message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.messages m
    INNER JOIN public.threads t ON m.thread_id = t.id
    WHERE m.id = message_id
      AND t.org_id = public.get_user_org_id()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PART 5: Grant Permissions
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role_or_higher(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_resource(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_thread(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_message(UUID) TO authenticated;

-- ============================================================================
-- PART 6: Performance Indexes for Helper Functions
-- ============================================================================

-- These indexes speed up the fallback database lookups in helper functions
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_org_id_role ON public.users(org_id, role);
CREATE INDEX IF NOT EXISTS idx_threads_org_id ON public.threads(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_org ON public.messages(thread_id);

-- ============================================================================
-- PART 7: Documentation Comments
-- ============================================================================

COMMENT ON FUNCTION public.get_user_org_id() IS
'Returns the current user''s organization ID from JWT app_metadata.
Extremely fast (~0.1ms) as it reads from cached JWT claims.
Fallback to database lookup if JWT parsing fails.
Used extensively in RLS policies for org isolation.';

COMMENT ON FUNCTION public.get_user_role() IS
'Returns the current user''s role from JWT app_metadata.
Fast (~0.1ms) as it reads from cached JWT claims.
Fallback to database lookup if JWT parsing fails.
Used in RLS policies for role-based access control.';

COMMENT ON FUNCTION public.check_user_role(TEXT) IS
'Checks if the current user has a specific role (exact match).
Example: check_user_role(''owner'') returns true only for owners.';

COMMENT ON FUNCTION public.has_role_or_higher(TEXT) IS
'Checks if the current user has the required role or higher in the hierarchy.
Hierarchy: owner > admin > employee > guest
Example: has_role_or_higher(''employee'') returns true for employees, admins, and owners.';

COMMENT ON FUNCTION public.is_org_owner() IS
'Returns true if the current user is an owner of their organization.
Optimized for use in RLS policies where only owners can perform certain actions.';

COMMENT ON FUNCTION public.is_org_admin() IS
'Returns true if the current user is an owner or admin of their organization.
Optimized for use in RLS policies where admins and owners can perform management actions.';

COMMENT ON FUNCTION public.has_org_access(UUID) IS
'Checks if the current user has access to a specific organization.
Returns true if target_org_id matches the user''s org_id.
Used for cross-org access validation.';

COMMENT ON FUNCTION public.can_manage_resource(UUID) IS
'Checks if the current user can manage a resource (edit/delete).
Returns true if resource belongs to user''s org AND user is admin/owner.
Combines org access check with role check for efficiency.';

COMMENT ON FUNCTION public.can_access_thread(UUID) IS
'Checks if the current user can access a specific thread.
Returns true if thread belongs to user''s organization.
Used for cascading security in threads and messages.';

COMMENT ON FUNCTION public.can_access_message(UUID) IS
'Checks if the current user can access a specific message.
Returns true if message''s thread belongs to user''s organization.
Implements cascading security through thread ownership.';

-- ============================================================================
-- PART 8: Testing Queries
-- ============================================================================

-- Uncomment to test helper functions after applying migration:
/*
-- Test get_user_org_id (should return your org_id)
SELECT public.get_user_org_id();

-- Test get_user_role (should return your role)
SELECT public.get_user_role();

-- Test is_org_owner (should return true/false)
SELECT public.is_org_owner();

-- Test is_org_admin (should return true/false)
SELECT public.is_org_admin();

-- Performance comparison (JWT-based vs database lookup)
EXPLAIN ANALYZE SELECT public.get_user_org_id();
EXPLAIN ANALYZE SELECT org_id FROM public.users WHERE id = auth.uid();
-- JWT-based should be 10-100x faster!
*/
