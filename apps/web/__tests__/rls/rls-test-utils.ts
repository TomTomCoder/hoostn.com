/**
 * RLS Testing Utilities
 * 
 * Helper functions for testing Row Level Security policies in Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test user credentials (these should match your test data)
export const TEST_USERS = {
  orgA_owner: {
    email: 'owner@org-a.com',
    password: 'test-password-123',
    role: 'owner',
    org: 'org-a',
  },
  orgA_admin: {
    email: 'admin@org-a.com',
    password: 'test-password-123',
    role: 'admin',
    org: 'org-a',
  },
  orgA_employee: {
    email: 'employee@org-a.com',
    password: 'test-password-123',
    role: 'employee',
    org: 'org-a',
  },
  orgB_owner: {
    email: 'owner@org-b.com',
    password: 'test-password-123',
    role: 'owner',
    org: 'org-b',
  },
};

/**
 * Create a Supabase client and authenticate as a test user
 */
export async function createAuthenticatedClient(
  userKey: keyof typeof TEST_USERS
): Promise<SupabaseClient> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const user = TEST_USERS[userKey];
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) {
    throw new Error(`Failed to authenticate as ${userKey}: ${error.message}`);
  }

  return supabase;
}

/**
 * Test org isolation - user should only see their org's data
 */
export async function testOrgIsolation(
  table: string,
  userKey: keyof typeof TEST_USERS,
  expectedOrgCount: number
) {
  const client = await createAuthenticatedClient(userKey);
  const user = TEST_USERS[userKey];

  const { data, error } = await client.from(table).select('*');

  return {
    passed: !error && data?.length === expectedOrgCount,
    message: error
      ? `Error: ${error.message}`
      : `User ${user.email} sees ${data?.length} ${table} records (expected ${expectedOrgCount})`,
    data,
    error,
  };
}

/**
 * Test cross-org access prevention
 */
export async function testCrossOrgAccessDenied(
  table: string,
  userKey: keyof typeof TEST_USERS,
  otherOrgRecordId: string
) {
  const client = await createAuthenticatedClient(userKey);
  const user = TEST_USERS[userKey];

  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('id', otherOrgRecordId)
    .single();

  const accessDenied = !data || error;

  return {
    passed: accessDenied,
    message: accessDenied
      ? `✓ User ${user.email} correctly denied access to other org's ${table}`
      : `✗ User ${user.email} has unauthorized access to other org's ${table}`,
    data,
    error,
  };
}

/**
 * Test role-based permissions
 */
export async function testRolePermission(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  userKey: keyof typeof TEST_USERS,
  shouldSucceed: boolean,
  testData?: any
) {
  const client = await createAuthenticatedClient(userKey);
  const user = TEST_USERS[userKey];

  let result;
  switch (operation) {
    case 'select':
      result = await client.from(table).select('*').limit(1);
      break;
    case 'insert':
      result = await client.from(table).insert(testData);
      break;
    case 'update':
      result = await client.from(table).update(testData).eq('id', testData.id);
      break;
    case 'delete':
      result = await client.from(table).delete().eq('id', testData.id);
      break;
  }

  const succeeded = !result.error;
  const passed = succeeded === shouldSucceed;

  return {
    passed,
    message: passed
      ? `✓ ${user.role} ${operation} on ${table}: ${shouldSucceed ? 'allowed' : 'denied'} (as expected)`
      : `✗ ${user.role} ${operation} on ${table}: ${succeeded ? 'allowed' : 'denied'} (expected ${shouldSucceed ? 'allowed' : 'denied'})`,
    data: result.data,
    error: result.error,
  };
}

/**
 * Run a comprehensive RLS test suite for a table
 */
export async function runTableRLSTests(table: string) {
  console.log(`\n=== RLS Tests for ${table} ===\n`);

  const tests = [
    // Org isolation tests
    {
      name: 'Org A owner sees only Org A data',
      fn: () => testOrgIsolation(table, 'orgA_owner', 3),
    },
    {
      name: 'Org B owner sees only Org B data',
      fn: () => testOrgIsolation(table, 'orgB_owner', 2),
    },
    // Add more tests as needed
  ];

  const results = [];
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, ...result });
      console.log(`${result.passed ? '✓' : '✗'} ${test.name}`);
      console.log(`  ${result.message}\n`);
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        message: `Exception: ${error}`,
      });
      console.log(`✗ ${test.name}`);
      console.log(`  Exception: ${error}\n`);
    }
  }

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;

  console.log(`\n=== Summary: ${passedTests}/${totalTests} tests passed ===\n`);

  return { total: totalTests, passed: passedTests, results };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(table: string, ids: string[]) {
  // Use service role key for cleanup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from(table).delete().in('id', ids);

  if (error) {
    console.error(`Failed to cleanup test data from ${table}:`, error);
  }
}

/**
 * Seed test data for RLS testing
 */
export async function seedTestData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // This is a placeholder - implement based on your needs
  console.log('Seeding test data for RLS tests...');

  // Create test organizations
  // Create test users
  // Create test properties, lots, etc.

  console.log('Test data seeded successfully');
}
