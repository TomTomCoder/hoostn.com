# 🧪 Hoostn Authentication System - Testing Strategy

**Version:** 1.0
**Date:** November 12, 2025
**Coverage Target:** 80%+

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)
5. [Security Tests](#security-tests)
6. [Performance Tests](#performance-tests)
7. [Test Data Management](#test-data-management)
8. [CI/CD Integration](#cicd-integration)

---

## 🎯 Testing Overview

### Testing Pyramid

```
                  /\
                 /  \     E2E Tests (10%)
                /____\    - Critical user flows
               /      \   - Real browser testing
              /        \
             /__________\ Integration Tests (30%)
            /            \ - API endpoints
           /              \ - Database operations
          /________________\ Unit Tests (60%)
         /                  \ - Helper functions
        /____________________\ - Business logic
```

### Test Coverage Goals

- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All API routes and server actions
- **E2E Tests:** Critical user journeys (signup, login, logout)
- **Security Tests:** RLS policies, authentication flows
- **Performance Tests:** Page load times, database query performance

---

## 🔬 Unit Tests

### Files to Test

#### 1. RLS Helper Functions

**Location:** `supabase/migrations/20250112000003_rls_helpers.sql`

**Test Cases:**

```sql
-- Test: get_user_org_id() returns correct org_id from JWT
CREATE OR REPLACE FUNCTION test_get_user_org_id()
RETURNS void AS $$
DECLARE
  test_org_id UUID := gen_random_uuid();
  result_org_id UUID;
BEGIN
  -- Set JWT claims
  SET request.jwt.claims = jsonb_build_object(
    'app_metadata', jsonb_build_object('org_id', test_org_id)
  );

  -- Call function
  SELECT get_user_org_id() INTO result_org_id;

  -- Assert
  ASSERT result_org_id = test_org_id, 'get_user_org_id should return org_id from JWT';
END;
$$ LANGUAGE plpgsql;

-- Test: get_user_org_id() returns null when JWT missing
-- Test: check_user_role() returns correct role
-- Test: is_org_owner() returns true for owners
-- Test: is_org_admin() returns true for admins/owners
```

**Run Tests:**

```bash
# Install pgTAP for PostgreSQL testing
# Then run:
pg_prove tests/unit/rls_helpers.sql
```

---

#### 2. Server Actions

**Location:** `apps/web/lib/actions/auth.ts`

**Test File:** `apps/web/lib/actions/__tests__/auth.test.ts`

```typescript
import { signInWithMagicLink, signUpWithMagicLink } from '../auth';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

describe('signInWithMagicLink', () => {
  it('should validate email format', async () => {
    const formData = new FormData();
    formData.append('email', 'invalid-email');

    const result = await signInWithMagicLink(formData);

    expect(result).toEqual({
      error: 'Please enter a valid email address'
    });
  });

  it('should call Supabase with correct parameters', async () => {
    const mockSignInWithOtp = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithOtp: mockSignInWithOtp }
    });

    const formData = new FormData();
    formData.append('email', 'test@example.com');

    const result = await signInWithMagicLink(formData);

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        shouldCreateUser: false,
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      }
    });
    expect(result).toEqual({ success: true });
  });

  it('should handle user not found error', async () => {
    const mockSignInWithOtp = jest.fn().mockResolvedValue({
      error: { message: 'User not found' }
    });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithOtp: mockSignInWithOtp }
    });

    const formData = new FormData();
    formData.append('email', 'nonexistent@example.com');

    const result = await signInWithMagicLink(formData);

    expect(result).toEqual({
      error: 'No account found with this email. Please sign up first.'
    });
  });
});

describe('signUpWithMagicLink', () => {
  it('should validate all required fields', async () => {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    // Missing fullName and organizationName

    const result = await signUpWithMagicLink(formData);

    expect(result.error).toBeDefined();
  });

  it('should pass metadata to Supabase', async () => {
    const mockSignInWithOtp = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithOtp: mockSignInWithOtp }
    });

    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('fullName', 'John Doe');
    formData.append('organizationName', 'Acme Inc');

    await signUpWithMagicLink(formData);

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo: expect.any(String),
        data: {
          full_name: 'John Doe',
          organization_name: 'Acme Inc',
        }
      }
    });
  });
});
```

**Run Tests:**

```bash
npm run test -- auth.test.ts
```

---

#### 3. Middleware Route Protection

**Location:** `apps/web/middleware.ts`

**Test File:** `apps/web/__tests__/middleware.test.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock Supabase
jest.mock('@supabase/ssr');

describe('middleware', () => {
  it('should redirect unauthenticated users from protected routes', async () => {
    // Mock no user
    const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);

    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get('location')).toContain('/login');
  });

  it('should allow authenticated users to access protected routes', async () => {
    // Mock authenticated user
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } }
    });

    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await middleware(request);

    expect(response.status).not.toBe(307);
  });

  it('should redirect authenticated users away from auth pages', async () => {
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } }
    });

    const request = new NextRequest('http://localhost:3000/login');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/dashboard');
  });

  it('should preserve redirect parameter', async () => {
    const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });

    const request = new NextRequest('http://localhost:3000/dashboard/properties');
    const response = await middleware(request);

    expect(response.headers.get('location')).toContain('redirect=/dashboard/properties');
  });
});
```

---

## 🔗 Integration Tests

### API Routes

#### Test: Auth Callback Route

**Location:** `apps/web/app/auth/callback/__tests__/route.test.ts`

```typescript
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Auth Callback', () => {
  it('should exchange code for session', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid_code'
    );

    const response = await GET(request);

    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get('location')).toContain('/dashboard');
  });

  it('should handle invalid code', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=invalid_code'
    );

    const response = await GET(request);

    expect(response.headers.get('location')).toContain('/auth-error');
  });

  it('should preserve next parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid_code&next=/dashboard/properties'
    );

    const response = await GET(request);

    expect(response.headers.get('location')).toContain('/dashboard/properties');
  });
});
```

---

### Database Triggers

#### Test: handle_new_user() Trigger

**Location:** `tests/integration/auth_triggers.test.sql`

```sql
-- Test: Signup creates organization and user profile
BEGIN;

-- Insert test user via auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  '{"full_name": "Test User", "organization_name": "Test Org"}'::jsonb
);

-- Verify organization created
SELECT * FROM organizations WHERE name = 'Test Org';
-- Expect: 1 row

-- Verify user profile created
SELECT * FROM users
WHERE id = '00000000-0000-0000-0000-000000000001'
AND role = 'owner';
-- Expect: 1 row

-- Verify org_id set in app_metadata
SELECT raw_app_meta_data->>'org_id' FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001';
-- Expect: UUID matching organization.id

ROLLBACK;
```

---

## 🎭 End-to-End Tests

### Playwright Tests

**Location:** `tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete signup flow', async ({ page }) => {
    // Navigate to signup
    await page.goto('http://localhost:3000/signup');

    // Fill out form
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.fill('input[name="organizationName"]', 'Acme Inc');
    await page.fill('input[name="email"]', 'john@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Check your email')).toBeVisible();

    // In a real test, you'd:
    // 1. Fetch email from Inbucket API
    // 2. Extract magic link
    // 3. Navigate to magic link
    // 4. Verify redirect to dashboard
  });

  test('should complete login flow', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/login');

    // Fill email
    await page.fill('input[name="email"]', 'existing@example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should protect dashboard routes', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should complete full authentication journey', async ({ page, context }) => {
    // 1. Signup
    await page.goto('http://localhost:3000/signup');
    await page.fill('input[name="fullName"]', 'Jane Smith');
    await page.fill('input[name="organizationName"]', 'Smith Properties');
    await page.fill('input[name="email"]', 'jane@test.com');
    await page.click('button[type="submit"]');

    // 2. Get magic link from Inbucket
    const inbucketResponse = await page.request.get(
      'http://localhost:54324/api/v1/mailbox/jane@test.com'
    );
    const emails = await inbucketResponse.json();
    const latestEmail = emails[0];

    // Extract magic link from email body
    const emailBody = await page.request.get(
      `http://localhost:54324/api/v1/mailbox/jane@test.com/${latestEmail.id}`
    );
    const emailContent = await emailBody.text();
    const magicLinkMatch = emailContent.match(/href="([^"]+)"/);
    const magicLink = magicLinkMatch![1];

    // 3. Click magic link
    await page.goto(magicLink);

    // 4. Verify dashboard access
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome, Jane')).toBeVisible();

    // 5. Test navigation
    await page.click('text=Properties');
    await expect(page).toHaveURL(/.*dashboard\/properties/);

    // 6. Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // 7. Verify redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});
```

**Run E2E Tests:**

```bash
npm run test:e2e
```

---

## 🔒 Security Tests

### RLS Policy Tests

**Location:** `tests/security/rls.test.sql`

```sql
-- Test: Users can only see their own org's data
BEGIN;

-- Create two organizations
INSERT INTO organizations (id, name, slug) VALUES
  ('org-a', 'Org A', 'org-a'),
  ('org-b', 'Org B', 'org-b');

-- Create two users
INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
  ('user-a', 'a@example.com', '{"org_id": "org-a"}'::jsonb),
  ('user-b', 'b@example.com', '{"org_id": "org-b"}'::jsonb);

INSERT INTO users (id, email, org_id, role) VALUES
  ('user-a', 'a@example.com', 'org-a', 'owner'),
  ('user-b', 'b@example.com', 'org-b', 'owner');

-- Create properties for each org
INSERT INTO properties (id, name, org_id) VALUES
  ('prop-a', 'Property A', 'org-a'),
  ('prop-b', 'Property B', 'org-b');

-- Set session as User A
SET request.jwt.claims = '{"sub": "user-a", "app_metadata": {"org_id": "org-a"}}'::json;

-- User A should see only Property A
SELECT COUNT(*) FROM properties WHERE id = 'prop-a';
-- Expect: 1

SELECT COUNT(*) FROM properties WHERE id = 'prop-b';
-- Expect: 0 (RLS should block)

-- User A should not be able to insert into Org B
INSERT INTO properties (name, org_id) VALUES ('Hack', 'org-b');
-- Expect: ERROR - new row violates row-level security policy

ROLLBACK;
```

### SQL Injection Tests

```typescript
// Test: Verify all queries use parameterization
test('should prevent SQL injection in property search', async () => {
  const maliciousInput = "'; DROP TABLE properties; --";

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('name', maliciousInput);

  // Should not throw error or drop table
  expect(error).toBeNull();
  expect(data).toBeDefined();

  // Verify table still exists
  const { data: properties } = await supabase.from('properties').select('count');
  expect(properties).toBeDefined();
});
```

---

## ⚡ Performance Tests

### Page Load Tests

```typescript
import { test, expect } from '@playwright/test';

test('dashboard should load in under 3 seconds', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('http://localhost:3000/dashboard');

  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000);
});
```

### Database Query Performance

```sql
-- Test: Verify RLS queries use indexes
EXPLAIN ANALYZE
SELECT * FROM properties
WHERE org_id = get_user_org_id();

-- Expected output should show:
-- Index Scan using idx_properties_org_id (cost=0.15..8.17 rows=1)
-- Execution Time: < 1ms
```

---

## 📊 Test Data Management

### Test Database Setup

```sql
-- Create test data script
-- Location: tests/fixtures/test_data.sql

-- Reset test database
TRUNCATE TABLE users, organizations, properties CASCADE;

-- Create test organizations
INSERT INTO organizations (id, name, slug) VALUES
  ('test-org-1', 'Test Org 1', 'test-org-1'),
  ('test-org-2', 'Test Org 2', 'test-org-2');

-- Create test users
INSERT INTO users (id, email, full_name, org_id, role) VALUES
  ('test-user-1', 'test1@example.com', 'Test User 1', 'test-org-1', 'owner'),
  ('test-user-2', 'test2@example.com', 'Test User 2', 'test-org-2', 'owner'),
  ('test-user-3', 'test3@example.com', 'Test User 3', 'test-org-1', 'employee');

-- Create test properties
INSERT INTO properties (name, org_id) VALUES
  ('Test Property 1', 'test-org-1'),
  ('Test Property 2', 'test-org-2');
```

### Load Test Data

```bash
npm run db:reset  # Reset database
npm run db:seed   # Load test data
```

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow

**Location:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run type-check

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:latest
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run db:push
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
```

---

## ✅ Test Execution Checklist

### Before Each Deployment

- [ ] Run unit tests: `npm run test`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run security tests (RLS verification)
- [ ] Run performance tests
- [ ] Verify test coverage > 80%
- [ ] Check for console errors
- [ ] Verify no TypeScript errors: `npm run type-check`
- [ ] Verify no ESLint warnings: `npm run lint`

---

## 📈 Test Coverage Report

Generate coverage report:

```bash
npm run test -- --coverage
```

View HTML report:

```bash
open coverage/lcov-report/index.html
```

**Target Coverage:**
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

---

**Last Updated:** November 12, 2025
**Version:** 1.0
**Status:** ✅ Ready for Implementation
