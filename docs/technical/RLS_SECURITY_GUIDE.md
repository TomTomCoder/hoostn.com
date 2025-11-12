# Row Level Security (RLS) Implementation Guide
## Multi-Tenant Security for Hoostn.com

**Last Updated:** 2025-11-12  
**Author:** Development Team  
**Status:** Active Development

---

## Table of Contents

1. [Overview](#overview)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Multi-Tenant RLS Patterns](#multi-tenant-rls-patterns)
4. [Performance Optimization](#performance-optimization)
5. [Concrete RLS Policy Examples](#concrete-rls-policy-examples)
6. [Auth Integration](#auth-integration)
7. [Best Practices](#best-practices)
8. [Testing & Debugging](#testing--debugging)
9. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
10. [Action Items](#action-items)

---

## Overview

### What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that allows you to restrict which rows users can access in a database table. In Supabase, RLS is the primary mechanism for implementing multi-tenant data isolation.

### Why RLS Matters for Hoostn

Hoostn is a multi-tenant SaaS platform where:
- Multiple organizations (property managers) use the same database
- Each organization must only see their own data
- Users have different roles (owner, admin, employee)
- Data isolation is critical for security and compliance

**Key Principle:** Even if two organizations share the same database, they should NEVER see each other's data.

---

## Current Implementation Analysis

### Schema Structure (from 20250101000001_initial_schema.sql)

#### ✅ Current Strengths

1. **Multi-tenant Design**
   - All tables have `org_id` foreign keys
   - Consistent naming conventions
   - Proper CASCADE relationships

2. **RLS Enabled**
   - RLS is enabled on all critical tables
   - Basic policies exist for isolation

3. **Performance Indexes**
   - Indexes on `org_id` columns
   - Indexes on foreign keys
   - Date-based indexes for reservations

#### ❌ Current Gaps

1. **Incomplete Policies**
   - Only SELECT policies exist on some tables
   - Missing INSERT, UPDATE, DELETE policies
   - No role-based access control
   - threads, messages, ai_traces, handoffs lack policies

2. **Performance Issues**
   - Subqueries not optimized with SELECT wrapper
   - No JWT claim caching
   - Repeated `auth.uid()` calls per row

3. **Missing Role Differentiation**
   - No distinction between owner/admin/employee
   - All users in an org have same permissions
   - No cross-org access for support scenarios

4. **No Security Helper Functions**
   - Repeated policy logic across tables
   - No reusable permission checks
   - Difficult to maintain consistency

---

## Multi-Tenant RLS Patterns

### Pattern 1: Organization-Level Isolation (Current)

**Use Case:** Most tables - isolate data by organization

```sql
-- Current pattern (needs optimization)
CREATE POLICY "org_isolation" ON properties
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));
```

**Problems:**
- Subquery runs for every row
- Performance degrades with large datasets
- No caching of auth.uid()

### Pattern 2: Optimized Org Isolation (Recommended)

```sql
-- Optimized with SELECT wrapper for caching
CREATE POLICY "org_isolation_optimized" ON properties
  FOR SELECT USING (
    org_id = (
      SELECT org_id 
      FROM users 
      WHERE id = (SELECT auth.uid())
      LIMIT 1
    )
  );
```

**Benefits:**
- PostgreSQL caches (SELECT auth.uid()) result
- Single subquery execution per statement
- 10-100x performance improvement on large tables

### Pattern 3: Role-Based Access Control

**Use Case:** Different permissions for owner/admin/employee

```sql
-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Policy with role check
CREATE POLICY "admins_full_access" ON properties
  FOR ALL USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "employees_read_only" ON properties
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND get_user_role() = 'employee'
  );
```

### Pattern 4: User-Specific Data

**Use Case:** Users table - can only see own profile and org members

```sql
CREATE POLICY "users_own_profile" ON users
  FOR SELECT USING (
    id = (SELECT auth.uid())
    OR org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );
```

### Pattern 5: Cross-Organization Access (Support)

**Use Case:** Super admins or support staff need access to all orgs

```sql
-- Add is_super_admin column to users table first
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

CREATE POLICY "super_admin_access" ON properties
  FOR ALL USING (
    (SELECT is_super_admin FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = TRUE
    OR org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );
```

---

## Performance Optimization

### Critical Optimization: Wrap Functions in SELECT

❌ **SLOW** - Function runs per row:
```sql
CREATE POLICY "slow_policy" ON properties
  FOR SELECT USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));
```

✅ **FAST** - Function cached per statement:
```sql
CREATE POLICY "fast_policy" ON properties
  FOR SELECT USING (
    org_id = (
      SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1
    )
  );
```

**Performance Impact:** 10-100x faster on large tables (tested on 1M+ rows)

### Index Strategy

**Always index columns used in RLS policies:**

```sql
-- Already have these (good!)
CREATE INDEX idx_lots_org ON lots(org_id);
CREATE INDEX idx_reservations_org ON reservations(org_id);
CREATE INDEX idx_threads_org ON threads(org_id);

-- Need to add these
CREATE INDEX idx_users_auth_id ON users(id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_handoffs_thread ON handoffs(thread_id);
CREATE INDEX idx_ai_traces_thread ON ai_traces(thread_id);
```

### Helper Functions for Reusability

Create immutable/stable helper functions to avoid repeating logic:

```sql
-- Cache user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Cache user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('owner', 'admin') 
  FROM users 
  WHERE id = (SELECT auth.uid()) 
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Then use in policies
CREATE POLICY "admins_only" ON properties
  FOR DELETE USING (
    org_id = get_user_org_id() AND is_org_admin()
  );
```

### JWT Claims Optimization (Advanced)

For even better performance, store org_id in JWT custom claims:

```sql
-- Custom function to get org from JWT
CREATE OR REPLACE FUNCTION get_org_from_jwt()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid,
    (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );
$$ LANGUAGE SQL STABLE;
```

**Note:** This requires custom JWT claims configuration in Supabase Auth.

---

## Concrete RLS Policy Examples

### Organizations Table

**Purpose:** Users can only see their own organization

```sql
-- Enable RLS (already done)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing basic policy
DROP POLICY IF EXISTS "Users can view their org" ON organizations;

-- SELECT: View own organization
CREATE POLICY "org_select_own" ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- UPDATE: Only owners can update org details
CREATE POLICY "org_update_owner" ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = 'owner'
  )
  WITH CHECK (
    id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = 'owner'
  );

-- INSERT: Not allowed via RLS (use service role for org creation)
-- DELETE: Not allowed via RLS (use service role for org deletion)
```

### Users Table

**Purpose:** Users can see their own profile and org members

```sql
-- Enable RLS (already done)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing basic policy
DROP POLICY IF EXISTS "Users can view their profile" ON users;

-- SELECT: View own profile and org members
CREATE POLICY "users_select_org_members" ON users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- INSERT: Allow during signup (via trigger or service role)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- UPDATE: Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    -- Prevent changing org_id or critical fields
    AND org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- UPDATE: Owners/admins can update team members
CREATE POLICY "users_update_team_admin" ON users
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );

-- DELETE: Only owners can remove team members
CREATE POLICY "users_delete_owner" ON users
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = 'owner'
    AND id != (SELECT auth.uid()) -- Can't delete yourself
  );
```

### Properties Table

**Purpose:** Properties belong to organizations, managed by admins/owners

```sql
-- Enable RLS (already done)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing basic policy
DROP POLICY IF EXISTS "Users can view their org properties" ON properties;

-- SELECT: All org members can view properties
CREATE POLICY "properties_select_org" ON properties
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- INSERT: Only admins/owners can create properties
CREATE POLICY "properties_insert_admin" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );

-- UPDATE: Only admins/owners can update properties
CREATE POLICY "properties_update_admin" ON properties
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );

-- DELETE: Only owners can delete properties
CREATE POLICY "properties_delete_owner" ON properties
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = 'owner'
  );
```

### Lots Table

**Purpose:** Lots belong to properties and organizations

```sql
-- Enable RLS (already done)
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can manage their org lots" ON lots;

-- SELECT: All org members can view lots
CREATE POLICY "lots_select_org" ON lots
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- INSERT: Admins/owners can create lots
CREATE POLICY "lots_insert_admin" ON lots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
    -- Verify property belongs to same org
    AND property_id IN (
      SELECT id FROM properties 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- UPDATE: Admins/owners can update lots
CREATE POLICY "lots_update_admin" ON lots
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );

-- DELETE: Only owners can delete lots
CREATE POLICY "lots_delete_owner" ON lots
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = 'owner'
  );
```

### Reservations Table

**Purpose:** Reservations are critical - all org members can view, admins/owners can manage

```sql
-- Enable RLS (already done)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing basic policy
DROP POLICY IF EXISTS "Users can view their org reservations" ON reservations;

-- SELECT: All org members can view reservations
CREATE POLICY "reservations_select_org" ON reservations
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- INSERT: All authenticated org members can create reservations
CREATE POLICY "reservations_insert_org" ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    -- Verify lot belongs to same org
    AND lot_id IN (
      SELECT id FROM lots 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- UPDATE: Admins/owners can update reservations
CREATE POLICY "reservations_update_admin" ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );

-- DELETE: Only owners can delete reservations (should be rare)
CREATE POLICY "reservations_delete_owner" ON reservations
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) = 'owner'
  );
```

### Threads Table (Chat)

**Purpose:** Chat threads belong to organizations

```sql
-- Enable RLS (already done)
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- SELECT: All org members can view threads
CREATE POLICY "threads_select_org" ON threads
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- INSERT: All org members can create threads
CREATE POLICY "threads_insert_org" ON threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- UPDATE: All org members can update threads (status changes)
CREATE POLICY "threads_update_org" ON threads
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );

-- DELETE: Only admins/owners can delete threads
CREATE POLICY "threads_delete_admin" ON threads
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );
```

### Messages Table

**Purpose:** Messages belong to threads, inherit org access through threads

```sql
-- Enable RLS (already done)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Can view messages if you can view the thread
CREATE POLICY "messages_select_via_thread" ON messages
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- INSERT: Can create messages in org threads
CREATE POLICY "messages_insert_via_thread" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- UPDATE: Only authors can update their own messages (within 5 minutes)
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    AND created_at > NOW() - INTERVAL '5 minutes'
    AND thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- DELETE: Admins/owners can delete messages
CREATE POLICY "messages_delete_admin" ON messages
  FOR DELETE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );
```

### AI Traces Table

**Purpose:** Monitoring data - admins/owners only

```sql
-- Enable RLS (already done)
ALTER TABLE ai_traces ENABLE ROW LEVEL SECURITY;

-- SELECT: Only admins/owners can view AI traces
CREATE POLICY "ai_traces_select_admin" ON ai_traces
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );

-- INSERT: System/service role only (not via RLS)
-- No user-facing INSERT policy

-- UPDATE/DELETE: Not allowed via RLS
```

### Handoffs Table

**Purpose:** HITL escalations - all org members can view, create

```sql
-- Enable RLS (already done)
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;

-- SELECT: All org members can view handoffs
CREATE POLICY "handoffs_select_org" ON handoffs
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- INSERT: All org members can create handoffs
CREATE POLICY "handoffs_insert_org" ON handoffs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- UPDATE: Assigned user or admins can update handoffs
CREATE POLICY "handoffs_update_assigned" ON handoffs
  FOR UPDATE
  TO authenticated
  USING (
    (
      assigned_to = (SELECT auth.uid())
      OR (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
    )
    AND thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  )
  WITH CHECK (
    (
      assigned_to = (SELECT auth.uid())
      OR (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
    )
    AND thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
  );

-- DELETE: Only admins/owners can delete handoffs
CREATE POLICY "handoffs_delete_admin" ON handoffs
  FOR DELETE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM threads 
      WHERE org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    )
    AND (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
  );
```

---

## Auth Integration

### How auth.uid() Works

```sql
-- auth.uid() returns the UUID of the currently authenticated user
-- It's extracted from the JWT token sent with each request
SELECT auth.uid(); -- Returns: 123e4567-e89b-12d3-a456-426614174000

-- The function checks the JWT token's 'sub' claim
-- If no valid token, returns NULL
```

### JWT Token Structure

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "exp": 1699564800,
  "iat": 1699561200,
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {
    "full_name": "John Doe"
  }
}
```

### Accessing JWT Claims in Policies

```sql
-- Get full JWT claims
SELECT current_setting('request.jwt.claims', true)::json;

-- Get specific claim
SELECT current_setting('request.jwt.claims', true)::json->>'email';

-- Custom claims (if configured)
SELECT current_setting('request.jwt.claims', true)::json->>'org_id';
```

### Custom JWT Claims (Advanced)

To add custom claims like `org_id` to the JWT:

```sql
-- Create a function that Supabase Auth calls during token generation
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
  user_role text;
BEGIN
  -- Fetch user's org and role
  SELECT org_id, role INTO user_org_id, user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  -- Set custom claims
  claims := event->'claims';
  claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id));
  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));

  -- Update event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
```

Then configure in Supabase Dashboard under **Authentication > Hooks**.

### Session vs JWT Checks

**JWT-based (Recommended for RLS):**
- Fast, stateless
- Claims cached in token
- Used in RLS policies
- Example: `auth.uid()`, `auth.jwt()`

**Session-based (API/Application Layer):**
- Requires database lookup
- More flexible
- Used in API routes
- Example: `supabase.auth.getSession()`

```typescript
// API Route - Session-based
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  // Check session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // RLS will automatically filter based on JWT
  const { data } = await supabase.from('properties').select('*');
  return Response.json(data);
}
```

---

## Best Practices

### 1. Policy Naming Conventions

Use consistent, descriptive names:

```
<table>_<operation>_<constraint>

Examples:
- properties_select_org
- users_update_own
- reservations_delete_owner
- messages_insert_via_thread
```

### 2. Always Specify TO Clause

```sql
-- Bad: Policy applies to all roles including anon
CREATE POLICY "policy" ON table FOR SELECT USING (...);

-- Good: Policy only for authenticated users
CREATE POLICY "policy" ON table FOR SELECT TO authenticated USING (...);
```

### 3. Use WITH CHECK for Mutations

```sql
-- INSERT/UPDATE need WITH CHECK to validate new data
CREATE POLICY "safe_insert" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
  );
```

### 4. Test Policies as Different Users

```sql
-- Supabase SQL Editor - Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Then run your query
SELECT * FROM properties;

-- Reset
RESET request.jwt.claims;
```

### 5. Separate Policies by Operation

Don't use `FOR ALL` unless absolutely necessary:

```sql
-- Bad: All operations in one policy
CREATE POLICY "everything" ON properties
  FOR ALL USING (...);

-- Good: Separate policies for clarity
CREATE POLICY "properties_select_org" ON properties FOR SELECT ...;
CREATE POLICY "properties_insert_admin" ON properties FOR INSERT ...;
CREATE POLICY "properties_update_admin" ON properties FOR UPDATE ...;
CREATE POLICY "properties_delete_owner" ON properties FOR DELETE ...;
```

### 6. Document Complex Policies

```sql
-- Complex policy with explanation
CREATE POLICY "reservations_update_business_logic" ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    -- User is in the same org
    org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1)
    AND (
      -- Either: User is admin/owner
      (SELECT role FROM users WHERE id = (SELECT auth.uid()) LIMIT 1) IN ('owner', 'admin')
      -- Or: Reservation is still pending and created recently
      OR (status = 'pending' AND created_at > NOW() - INTERVAL '1 hour')
    )
  );
-- Comment: Allows admins full update access, regular users can update recent pending reservations
```

### 7. Monitor RLS Performance

```sql
-- Check policy execution time
EXPLAIN ANALYZE SELECT * FROM properties;

-- Look for InitPlan vs SubPlan
-- InitPlan = cached (good)
-- SubPlan = per-row (bad)
```

### 8. Use Helper Functions

Create reusable functions for common checks:

```sql
-- Define once
CREATE OR REPLACE FUNCTION get_user_org_id() ...;
CREATE OR REPLACE FUNCTION is_org_admin() ...;

-- Use everywhere
CREATE POLICY "..." USING (org_id = get_user_org_id());
CREATE POLICY "..." USING (is_org_admin());
```

---

## Testing & Debugging

### Testing RLS Policies

#### 1. SQL Editor Testing

```sql
-- Test as specific user
SET request.jwt.claims = '{"sub": "123e4567-e89b-12d3-a456-426614174000", "role": "authenticated"}';

-- Should only return user's org data
SELECT * FROM properties;

-- Should fail or return empty
SELECT * FROM properties WHERE org_id != (SELECT org_id FROM users WHERE id = '123e4567-e89b-12d3-a456-426614174000' LIMIT 1);

-- Reset
RESET request.jwt.claims;
```

#### 2. TypeScript/Jest Testing

```typescript
// __tests__/rls/properties.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Properties RLS', () => {
  it('should only return user\'s org properties', async () => {
    const supabase = createClient(url, anonKey);
    
    // Sign in as user from org A
    await supabase.auth.signInWithPassword({
      email: 'user-a@org-a.com',
      password: 'password',
    });

    const { data, error } = await supabase
      .from('properties')
      .select('*');

    // Should only have org A properties
    expect(data).toHaveLength(3);
    expect(data.every(p => p.org_id === 'org-a-uuid')).toBe(true);
  });

  it('should prevent cross-org access', async () => {
    // Sign in as user from org B
    await supabase.auth.signInWithPassword({
      email: 'user-b@org-b.com',
      password: 'password',
    });

    // Try to access org A property
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', 'org-a-property-uuid')
      .single();

    // Should fail
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
```

#### 3. E2E Testing with Playwright

```typescript
// e2e/rls-isolation.spec.ts
import { test, expect } from '@playwright/test';

test('organizations are isolated', async ({ page, context }) => {
  // Login as Org A user
  await page.goto('/login');
  await page.fill('[name="email"]', 'user-a@org-a.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to properties
  await page.goto('/properties');

  // Should see only Org A properties
  await expect(page.locator('[data-testid="property-card"]')).toHaveCount(3);

  // Open new tab as Org B user
  const page2 = await context.newPage();
  await page2.goto('/login');
  await page2.fill('[name="email"]', 'user-b@org-b.com');
  await page2.fill('[name="password"]', 'password');
  await page2.click('button[type="submit"]');
  await page2.goto('/properties');

  // Should see different properties
  await expect(page2.locator('[data-testid="property-card"]')).toHaveCount(5);
});
```

### Debugging RLS Issues

#### Issue 1: Policy Not Working

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Check specific table policies
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

#### Issue 2: Performance Problems

```sql
-- Analyze query plan
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM properties;

-- Look for:
-- - SubPlan (bad - runs per row)
-- - InitPlan (good - runs once)
-- - Seq Scan (bad on large tables - need index)
-- - Index Scan (good)

-- Check if auth.uid() is wrapped
-- Bad: "SubPlan 1" shows auth.uid() called per row
-- Good: "InitPlan 1" shows auth.uid() called once
```

#### Issue 3: "Row-level security policy violated"

This means:
1. RLS is enabled
2. No policy allows the operation

```sql
-- Check what policies exist for the operation
SELECT * FROM pg_policies 
WHERE tablename = 'properties' 
AND cmd = 'INSERT'; -- or 'SELECT', 'UPDATE', 'DELETE'

-- If none, create one
CREATE POLICY "missing_policy" ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (...);
```

#### Issue 4: User Can't See Any Data

Check the user's org_id:

```sql
-- As service role
SELECT id, email, org_id, role 
FROM users 
WHERE email = 'problem-user@example.com';

-- If org_id is NULL, that's your problem
UPDATE users 
SET org_id = 'correct-org-uuid' 
WHERE id = 'user-uuid';
```

### RLS Debugging Dashboard Query

```sql
-- Comprehensive RLS status check
SELECT 
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count,
  STRING_AGG(DISTINCT p.cmd::text, ', ') AS operations_covered
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

Expected output:
```
tablename       | rls_enabled | policy_count | operations_covered
----------------|-------------|--------------|-------------------
organizations   | true        | 2            | SELECT, UPDATE
users           | true        | 5            | SELECT, INSERT, UPDATE, DELETE
properties      | true        | 4            | SELECT, INSERT, UPDATE, DELETE
lots            | true        | 4            | SELECT, INSERT, UPDATE, DELETE
reservations    | true        | 4            | SELECT, INSERT, UPDATE, DELETE
threads         | true        | 4            | SELECT, INSERT, UPDATE, DELETE
messages        | true        | 4            | SELECT, INSERT, UPDATE, DELETE
ai_traces       | true        | 1            | SELECT
handoffs        | true        | 4            | SELECT, INSERT, UPDATE, DELETE
```

---

## Common Mistakes to Avoid

### 1. Forgetting to Enable RLS

❌ **DANGEROUS**
```sql
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  org_id UUID,
  secret TEXT
);
-- No RLS enabled = everyone can see everything!
```

✅ **SAFE**
```sql
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  org_id UUID,
  secret TEXT
);

ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON sensitive_data
  FOR SELECT TO authenticated USING (org_id = get_user_org_id());
```

### 2. Too Broad Policies

❌ **INSECURE**
```sql
-- Anyone authenticated can see everything
CREATE POLICY "allow_all" ON properties
  FOR SELECT TO authenticated USING (true);
```

✅ **SECURE**
```sql
-- Only org members can see org data
CREATE POLICY "org_only" ON properties
  FOR SELECT TO authenticated 
  USING (org_id = get_user_org_id());
```

### 3. Forgetting WITH CHECK on Mutations

❌ **VULNERABLE**
```sql
-- User could insert data with wrong org_id
CREATE POLICY "insert_property" ON properties
  FOR INSERT TO authenticated;
```

✅ **PROTECTED**
```sql
-- Enforce org_id matches user's org
CREATE POLICY "insert_property" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());
```

### 4. Not Wrapping auth.uid() for Performance

❌ **SLOW**
```sql
-- Calls auth.uid() for every row
USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
```

✅ **FAST**
```sql
-- Calls auth.uid() once per statement
USING (org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1))
```

### 5. Missing Indexes on RLS Columns

❌ **SLOW**
```sql
-- No index on org_id
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  org_id UUID,
  ...
);
```

✅ **FAST**
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  org_id UUID,
  ...
);

CREATE INDEX idx_properties_org ON properties(org_id);
```

### 6. Circular RLS References

❌ **BREAKS**
```sql
-- policies table depends on users
CREATE POLICY "..." ON policies
  USING (user_id IN (SELECT id FROM users WHERE ...));

-- users table depends on policies (circular!)
CREATE POLICY "..." ON users
  USING (id IN (SELECT user_id FROM policies WHERE ...));
```

✅ **WORKS**
```sql
-- Use direct auth checks, not cross-table dependencies
CREATE POLICY "..." ON policies
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "..." ON users
  USING (id = (SELECT auth.uid()));
```

### 7. Testing Only as Service Role

❌ **FALSE CONFIDENCE**
```typescript
// Using service role bypasses RLS!
const supabase = createClient(url, serviceRoleKey);
const { data } = await supabase.from('properties').select('*');
// This works even with broken RLS policies
```

✅ **PROPER TESTING**
```typescript
// Test as actual user (anon key)
const supabase = createClient(url, anonKey);
await supabase.auth.signInWithPassword({ email, password });
const { data } = await supabase.from('properties').select('*');
// This will fail if RLS policies are broken
```

### 8. Not Handling NULL org_id

❌ **BREAKS FOR NEW USERS**
```sql
-- If user.org_id is NULL, policy fails
USING (org_id = (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1))
```

✅ **HANDLES NULL**
```sql
-- Gracefully handle NULL (returns no data)
USING (
  org_id = COALESCE(
    (SELECT org_id FROM users WHERE id = (SELECT auth.uid()) LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  )
)
```

---

## Action Items

### Immediate (High Priority)

- [ ] **Add helper functions** for reusable RLS logic
  - `get_user_org_id()`
  - `get_user_role()`
  - `is_org_admin()`

- [ ] **Replace existing policies** with optimized versions (see examples above)
  - Drop current policies
  - Create new policies with SELECT wrapper for performance
  - Add INSERT, UPDATE, DELETE policies

- [ ] **Add missing indexes**
  - `users(id)`
  - `users(org_id)`

- [ ] **Add RLS policies** for tables without them
  - threads (has partial policies)
  - messages (missing)
  - ai_traces (missing)
  - handoffs (missing)

### Short Term (This Sprint)

- [ ] **Write RLS tests**
  - Unit tests for each table's policies
  - E2E tests for cross-org isolation
  - Performance benchmarks

- [ ] **Document user roles**
  - Define exact permissions for owner/admin/employee
  - Update schema if needed

- [ ] **Setup RLS monitoring**
  - Create dashboard queries for policy coverage
  - Add alerts for policy violations
  - Monitor query performance

### Medium Term (Next Sprint)

- [ ] **Implement custom JWT claims**
  - Add `org_id` to JWT
  - Add `user_role` to JWT
  - Update policies to use JWT claims

- [ ] **Add audit logging**
  - Log RLS policy violations
  - Track who accessed what data
  - Create audit trail table

- [ ] **Performance optimization**
  - Analyze slow queries with EXPLAIN
  - Add additional indexes as needed
  - Consider materialized views for complex queries

### Long Term (Roadmap)

- [ ] **Super admin support**
  - Add `is_super_admin` flag
  - Create separate policies for support access
  - Implement audit logging for admin actions

- [ ] **Column-level security**
  - Hide sensitive fields from employees
  - Implement field-level encryption for PII

- [ ] **Automated policy testing**
  - CI/CD RLS policy tests
  - Automated security scans
  - Policy regression testing

---

## Conclusion

Row Level Security is the foundation of Hoostn's multi-tenant security model. By following these best practices and implementing the recommended policies, you'll ensure:

- **Complete data isolation** between organizations
- **Role-based access control** for different user types
- **Optimal performance** with proper indexing and query optimization
- **Maintainable security** with reusable helper functions
- **Confidence** through comprehensive testing

### Key Takeaways

1. **Always enable RLS** on tables with user data
2. **Wrap auth.uid() in SELECT** for performance
3. **Index all RLS filter columns** (especially org_id)
4. **Separate policies** by operation (SELECT, INSERT, UPDATE, DELETE)
5. **Test as real users**, not service role
6. **Use helper functions** to avoid repeating logic
7. **Monitor and optimize** query performance regularly

### Next Steps

1. Review the [Action Items](#action-items) section
2. Create a new migration for helper functions and optimized policies
3. Write tests for each table's RLS policies
4. Deploy to staging and run performance tests
5. Monitor RLS policy violations in production

---

**Questions or Issues?**
- Supabase RLS Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Hoostn Dev Team: dev@hoostn.com
- Report security issues: security@hoostn.com

