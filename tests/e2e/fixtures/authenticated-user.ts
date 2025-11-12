import { test as base, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Authenticated User Fixture
 *
 * Provides a test fixture that automatically logs in a user before each test.
 * This fixture creates a Supabase session and sets the necessary cookies/tokens.
 */

export interface AuthenticatedFixtures {
  authenticatedPage: Page;
  testUserEmail: string;
  testUserId: string;
  testOrgId: string;
}

// Test user credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test-e2e@hoostn.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

/**
 * Extended test with authenticated user fixture
 */
export const test = base.extend<AuthenticatedFixtures>({
  testUserEmail: async ({}, use) => {
    await use(TEST_USER.email);
  },

  testUserId: async ({ page }, use) => {
    // Navigate to get access to localStorage
    await page.goto('/');

    // Get user ID from Supabase session in localStorage
    const userId = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const supabaseKey = keys.find(key => key.includes('supabase.auth.token'));
      if (supabaseKey) {
        const session = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
        return session?.currentSession?.user?.id || '';
      }
      return '';
    });

    await use(userId);
  },

  testOrgId: async ({ page }, use) => {
    // Get organization ID from the test user's profile
    await page.goto('/dashboard');

    const orgId = await page.evaluate(() => {
      // Try to extract org ID from the page or localStorage
      return window.localStorage.getItem('test_org_id') || '';
    });

    await use(orgId);
  },

  authenticatedPage: async ({ page }, use) => {
    // Navigate to the login page
    await page.goto('/auth/login');

    // Fill in login form
    const emailInput = page.getByLabel(/email|e-mail|adresse/i);
    const passwordInput = page.getByLabel(/mot de passe|password/i);

    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);

    // Submit the form
    const loginButton = page.getByRole('button', { name: /connexion|login|sign in/i });
    await loginButton.click();

    // Wait for navigation to dashboard or home
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });

    // Verify we're logged in
    await page.waitForSelector('[data-testid="user-menu"], [data-testid="user-profile"]', {
      timeout: 5000,
    }).catch(() => {
      // If specific selector not found, just verify we're not on login page
      if (page.url().includes('/auth/login')) {
        throw new Error('Login failed - still on login page');
      }
    });

    // Use the authenticated page
    await use(page);

    // Cleanup: logout after test
    await page.goto('/auth/signout').catch(() => {
      // Ignore errors during cleanup
    });
  },
});

export { expect } from '@playwright/test';

/**
 * Helper function to manually authenticate a page
 */
export async function authenticateUser(page: Page, email?: string, password?: string) {
  const credentials = {
    email: email || TEST_USER.email,
    password: password || TEST_USER.password,
  };

  await page.goto('/auth/login');

  const emailInput = page.getByLabel(/email|e-mail|adresse/i);
  const passwordInput = page.getByLabel(/mot de passe|password/i);

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  const loginButton = page.getByRole('button', { name: /connexion|login|sign in/i });
  await loginButton.click();

  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
}

/**
 * Helper function to sign out
 */
export async function signOut(page: Page) {
  await page.goto('/auth/signout');
  await page.waitForURL(/\/auth|\//, { timeout: 5000 });
}
