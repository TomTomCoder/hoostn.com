# RLS Verification Checklist

Use this checklist to verify that Row Level Security is properly implemented and secure.

## Pre-Deployment Checklist

### 1. Schema Verification

- [ ] All tables with user data have RLS enabled
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = false;
  -- Should return empty result
  ```

- [ ] All tables have org_id or equivalent tenant identifier
- [ ] All org_id columns are indexed
  ```sql
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname LIKE '%org%';
  ```

- [ ] Foreign key relationships are correct
- [ ] CASCADE deletes are configured properly

### 2. Helper Functions

- [ ] `get_user_org_id()` function exists and works
  ```sql
  SELECT get_user_org_id();
  ```

- [ ] `get_user_role()` function exists and works
  ```sql
  SELECT get_user_role();
  ```

- [ ] `is_org_admin()` function exists and works
  ```sql
  SELECT is_org_admin();
  ```

- [ ] `is_org_owner()` function exists and works
  ```sql
  SELECT is_org_owner();
  ```

- [ ] Helper functions are marked as STABLE
- [ ] Helper functions have SECURITY DEFINER
- [ ] Execute permissions granted to authenticated

### 3. Policy Coverage

- [ ] Every table has at least one policy
  ```sql
  SELECT t.tablename,
         COUNT(p.policyname) as policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename
  HAVING COUNT(p.policyname) = 0;
  -- Should return empty result
  ```

- [ ] All policies specify `TO authenticated`
  ```sql
  SELECT tablename, policyname, roles 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND 'authenticated' != ALL(roles);
  -- Should return empty or only service role policies
  ```

- [ ] INSERT policies have WITH CHECK
  ```sql
  SELECT tablename, policyname 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND cmd = 'INSERT' 
  AND with_check IS NULL;
  -- Should return empty result
  ```

- [ ] UPDATE policies have both USING and WITH CHECK
  ```sql
  SELECT tablename, policyname 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND cmd = 'UPDATE' 
  AND (qual IS NULL OR with_check IS NULL);
  -- Should return empty result
  ```

### 4. Policy Content

For each table, verify policies exist for:

#### organizations
- [ ] SELECT: Users can view their org
- [ ] UPDATE: Only owners can update

#### users
- [ ] SELECT: View own profile and org members
- [ ] INSERT: Create own profile
- [ ] UPDATE: Update own profile
- [ ] UPDATE: Admins can update team members
- [ ] DELETE: Owners can remove members

#### properties
- [ ] SELECT: All org members
- [ ] INSERT: Admins/owners only
- [ ] UPDATE: Admins/owners only
- [ ] DELETE: Owners only

#### lots
- [ ] SELECT: All org members
- [ ] INSERT: Admins/owners only
- [ ] UPDATE: Admins/owners only
- [ ] DELETE: Owners only

#### reservations
- [ ] SELECT: All org members
- [ ] INSERT: All org members
- [ ] UPDATE: Admins/owners only
- [ ] DELETE: Owners only

#### threads
- [ ] SELECT: All org members
- [ ] INSERT: All org members
- [ ] UPDATE: All org members
- [ ] DELETE: Admins/owners only

#### messages
- [ ] SELECT: Via thread access
- [ ] INSERT: Via thread access
- [ ] UPDATE: Own messages only (time-limited)
- [ ] DELETE: Admins/owners only

#### ai_traces
- [ ] SELECT: Admins/owners only

#### handoffs
- [ ] SELECT: All org members
- [ ] INSERT: All org members
- [ ] UPDATE: Assigned user or admins
- [ ] DELETE: Admins/owners only

### 5. Performance Optimization

- [ ] auth.uid() is wrapped in (SELECT ...) everywhere
  ```sql
  -- Check policy definitions don't have bare auth.uid()
  SELECT tablename, policyname, qual::text
  FROM pg_policies
  WHERE schemaname = 'public'
  AND qual::text LIKE '%auth.uid()%'
  AND qual::text NOT LIKE '%(SELECT auth.uid())%';
  -- Should return empty or acceptable exceptions
  ```

- [ ] Helper functions are used instead of repeated subqueries
- [ ] All RLS filter columns are indexed
- [ ] EXPLAIN ANALYZE shows InitPlan, not SubPlan
  ```sql
  EXPLAIN ANALYZE SELECT * FROM properties;
  -- Look for "InitPlan" not "SubPlan"
  ```

### 6. Testing

- [ ] Test data seeded for multiple orgs
- [ ] RLS test suite runs and passes
  ```bash
  npm run test:rls
  ```

- [ ] Org isolation tests pass
- [ ] Cross-org access prevention tests pass
- [ ] Role permission tests pass
- [ ] All CRUD operations tested

### 7. Security Verification

Test each scenario manually:

#### Org Isolation
- [ ] User A cannot see Org B's data
  ```sql
  -- As user from Org A
  SELECT * FROM properties 
  WHERE org_id = 'org-b-uuid';
  -- Should return empty
  ```

- [ ] User B cannot see Org A's data
- [ ] No data leakage through joins
- [ ] No data leakage through foreign keys

#### Role Permissions - Employee
- [ ] Can view all org data
- [ ] Cannot create properties
- [ ] Cannot update properties
- [ ] Cannot delete anything
- [ ] Cannot manage users

#### Role Permissions - Admin
- [ ] Can view all org data
- [ ] Can create properties
- [ ] Can update properties
- [ ] Cannot delete properties
- [ ] Can update users (not delete)

#### Role Permissions - Owner
- [ ] Can view all org data
- [ ] Can create properties
- [ ] Can update properties
- [ ] Can delete properties
- [ ] Can manage all users
- [ ] Cannot delete themselves

### 8. Edge Cases

- [ ] New user with NULL org_id cannot see any data
- [ ] User removed from org loses access immediately
- [ ] Role changes take effect immediately
- [ ] Unauthenticated requests are denied
- [ ] Service role bypasses RLS (expected)
- [ ] Anon role has no access (expected)

### 9. Production Readiness

- [ ] Migration tested in staging
- [ ] Rollback plan documented
- [ ] Performance benchmarks acceptable
- [ ] No breaking changes to API
- [ ] Client code doesn't need changes
- [ ] Monitoring alerts configured
- [ ] Documentation updated

### 10. Post-Deployment

- [ ] Verify RLS enabled in production
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```

- [ ] Verify policy count matches expected
  ```sql
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
  -- Should be 32+ policies
  ```

- [ ] No RLS violations in logs
- [ ] Query performance acceptable
- [ ] User reports no access issues
- [ ] Smoke test all user roles

## Automated Verification Script

Save and run this script to check multiple items:

```sql
-- RLS Verification Script
-- Run in Supabase SQL Editor

-- 1. Check RLS is enabled on all tables
SELECT 
  'RLS Status' as check_name,
  tablename,
  CASE WHEN rowsecurity THEN '✓ Enabled' ELSE '✗ DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check policy coverage
SELECT 
  'Policy Coverage' as check_name,
  t.tablename,
  COUNT(p.policyname) as policy_count,
  STRING_AGG(DISTINCT p.cmd::text, ', ') as operations
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY policy_count, t.tablename;

-- 3. Check helper functions exist
SELECT 
  'Helper Functions' as check_name,
  routine_name,
  CASE WHEN routine_name IN (
    'get_user_org_id',
    'get_user_role',
    'is_org_admin',
    'is_org_owner'
  ) THEN '✓ Found' ELSE '? Unknown' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%org%'
ORDER BY routine_name;

-- 4. Check indexes on org_id
SELECT 
  'Indexes' as check_name,
  tablename,
  indexname,
  '✓ Indexed' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (indexname LIKE '%org%' OR indexname LIKE '%user%')
ORDER BY tablename;

-- 5. Check for policies without WITH CHECK (INSERT/UPDATE)
SELECT 
  'Missing WITH CHECK' as check_name,
  tablename,
  policyname,
  cmd,
  '✗ MISSING WITH CHECK' as status
FROM pg_policies
WHERE schemaname = 'public'
AND cmd IN ('INSERT', 'UPDATE')
AND with_check IS NULL;

-- 6. Summary
SELECT 
  'Summary' as check_name,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%org%') as helper_functions;
```

## Security Incident Response

If you discover a security issue:

1. **DO NOT** disable RLS
2. **DO** document the issue immediately
3. **DO** notify security@hoostn.com
4. **DO** test a fix in development first
5. **DO** deploy the fix ASAP
6. **DO** audit logs for potential data access
7. **DO** update this checklist if needed

## Regular Maintenance

Perform these checks monthly:

- [ ] Run verification script
- [ ] Review new tables for RLS
- [ ] Check query performance
- [ ] Review audit logs
- [ ] Update documentation

## Sign-Off

Before deploying to production:

- [ ] Developer tested all checklist items
- [ ] Code review completed
- [ ] Security team approved
- [ ] Staging tests passed
- [ ] Rollback plan ready

**Developer:** _________________ Date: _______

**Reviewer:** _________________ Date: _______

**Security:** _________________ Date: _______

---

**Version:** 1.0  
**Last Updated:** 2025-11-12  
**Next Review:** 2025-12-12
