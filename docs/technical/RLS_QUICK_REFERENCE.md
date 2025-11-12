# RLS Quick Reference Card

## Common Patterns

### Get User's Org ID
```sql
public.get_user_org_id()
```

### Check if User is Admin/Owner
```sql
public.is_org_admin()  -- Returns true for 'owner' or 'admin'
public.is_org_owner()  -- Returns true for 'owner' only
```

### Get User's Role
```sql
public.get_user_role()  -- Returns 'owner', 'admin', or 'employee'
```

## Policy Templates

### SELECT - Org Isolation
```sql
CREATE POLICY "table_select_org" ON table_name
  FOR SELECT
  TO authenticated
  USING (org_id = public.get_user_org_id());
```

### INSERT - Admin Only
```sql
CREATE POLICY "table_insert_admin" ON table_name
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = public.get_user_org_id()
    AND public.is_org_admin()
  );
```

### UPDATE - Admin Only
```sql
CREATE POLICY "table_update_admin" ON table_name
  FOR UPDATE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_admin())
  WITH CHECK (org_id = public.get_user_org_id() AND public.is_org_admin());
```

### DELETE - Owner Only
```sql
CREATE POLICY "table_delete_owner" ON table_name
  FOR DELETE
  TO authenticated
  USING (org_id = public.get_user_org_id() AND public.is_org_owner());
```

### UPDATE - Own Record Only
```sql
CREATE POLICY "table_update_own" ON table_name
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
```

## Testing Queries

### Test as Specific User
```sql
-- Set user context
SET request.jwt.claims = '{"sub": "user-uuid-here", "role": "authenticated"}';

-- Run your query
SELECT * FROM properties;

-- Reset
RESET request.jwt.claims;
```

### Check RLS Status
```sql
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) AS policy_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### List All Policies
```sql
SELECT 
  tablename,
  policyname,
  cmd AS operation,
  CASE WHEN roles = '{authenticated}' THEN 'authenticated' ELSE roles::text END AS roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

### Check Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM properties WHERE org_id = public.get_user_org_id();

-- Look for:
-- ✅ "InitPlan" = cached function (good)
-- ❌ "SubPlan" = per-row function (bad)
-- ✅ "Index Scan" = using index (good)
-- ❌ "Seq Scan" = full table scan (bad on large tables)
```

## Debugging

### User Can't See Data
```sql
-- Check user's org_id
SELECT id, email, org_id, role FROM users WHERE email = 'user@example.com';

-- If org_id is NULL:
UPDATE users SET org_id = 'org-uuid' WHERE id = 'user-uuid';
```

### "Policy Violation" Error
```sql
-- Check what policies exist for the operation
SELECT * FROM pg_policies 
WHERE tablename = 'your_table' 
AND cmd = 'INSERT'; -- or SELECT, UPDATE, DELETE
```

### Performance Issues
```sql
-- Check if indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'your_table';

-- Add index if missing:
CREATE INDEX idx_table_org ON your_table(org_id);
```

## Role Permissions Matrix

| Operation | Owner | Admin | Employee |
|-----------|-------|-------|----------|
| View org data | ✅ | ✅ | ✅ |
| Create properties | ✅ | ✅ | ❌ |
| Update properties | ✅ | ✅ | ❌ |
| Delete properties | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ (update only) | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| Update org settings | ✅ | ❌ | ❌ |
| View AI traces | ✅ | ✅ | ❌ |

## Common Mistakes

❌ **DON'T:**
```sql
-- Forget to enable RLS
CREATE TABLE sensitive_data (...);

-- Use overly broad policies
USING (true)

-- Forget WITH CHECK on mutations
FOR INSERT TO authenticated;

-- Call auth.uid() without SELECT wrapper
WHERE user_id = auth.uid()
```

✅ **DO:**
```sql
-- Always enable RLS
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- Use specific conditions
USING (org_id = public.get_user_org_id())

-- Always use WITH CHECK
FOR INSERT TO authenticated WITH CHECK (...)

-- Wrap auth.uid() for caching
WHERE user_id = (SELECT auth.uid())
```

## Emergency Commands

### Disable RLS Temporarily (DANGEROUS - Dev Only)
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Re-enable RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Drop All Policies for Table
```sql
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'your_table' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, 'your_table');
  END LOOP;
END $$;
```

## Resources

- Full Guide: `/docs/technical/RLS_SECURITY_GUIDE.md`
- Migration: `/supabase/migrations/20250112000001_optimize_rls_policies.sql`
- Supabase Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
