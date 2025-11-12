import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 *
 * Tests cover:
 * - Signup page display and validation
 * - Login page display and validation
 * - Magic link authentication flow
 * - Unauthenticated access protection
 * - Sign out functionality
 */

test.describe('Authentication', () => {
  test.describe('Signup Flow', () => {
    test('should display signup page with all fields', async ({ page }) => {
      await page.goto('/signup');

      // Check page title
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

      // Check all form fields are present
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/organization name/i)).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();

      // Check submit button
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

      // Check sign in link
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();

      // Check terms and privacy links
      await expect(page.getByRole('link', { name: /terms of service/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /privacy policy/i })).toBeVisible();
    });

    test('should validate email format on signup', async ({ page }) => {
      await page.goto('/signup');

      // Fill in form with invalid email
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/organization name/i).fill('Test Organization');
      await page.getByLabel(/email address/i).fill('invalid-email');

      // Try to submit
      await page.getByRole('button', { name: /create account/i }).click();

      // HTML5 validation should prevent submission
      // Check that we're still on signup page
      expect(page.url()).toContain('/signup');
    });

    test('should show validation error for short name', async ({ page }) => {
      await page.goto('/signup');

      // Fill in form with short name
      await page.getByLabel(/full name/i).fill('A');
      await page.getByLabel(/organization name/i).fill('Test Organization');
      await page.getByLabel(/email address/i).fill('test@example.com');

      // Submit form
      await page.getByRole('button', { name: /create account/i }).click();

      // Should show error message
      await expect(page.getByRole('alert')).toContainText(/full name must be at least 2 characters/i);
    });

    test('should show validation error for short organization name', async ({ page }) => {
      await page.goto('/signup');

      // Fill in form with short organization name
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/organization name/i).fill('A');
      await page.getByLabel(/email address/i).fill('test@example.com');

      // Submit form
      await page.getByRole('button', { name: /create account/i }).click();

      // Should show error message
      await expect(page.getByRole('alert')).toContainText(/organization name must be at least 2 characters/i);
    });

    test('should show success message after signup', async ({ page }) => {
      await page.goto('/signup');

      // Fill in valid form data
      const timestamp = Date.now();
      const testEmail = `test-signup-${timestamp}@example.com`;

      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/organization name/i).fill('Test Organization');
      await page.getByLabel(/email address/i).fill(testEmail);

      // Submit form
      await page.getByRole('button', { name: /create account/i }).click();

      // Should show success state
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      });

      // Should show the email we entered
      await expect(page.getByText(testEmail)).toBeVisible();

      // Should show instruction message
      await expect(page.getByText(/click the link in the email/i)).toBeVisible();
    });
  });

  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');

      // Check page title
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

      // Check subtitle
      await expect(page.getByText(/sign in to your hoostn account/i)).toBeVisible();

      // Check email field
      await expect(page.getByLabel(/email address/i)).toBeVisible();

      // Check submit button
      await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible();

      // Check signup link
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();

      // Check support link
      await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible();
    });

    test('should validate email on login', async ({ page }) => {
      await page.goto('/login');

      // Try to submit without email
      await page.getByRole('button', { name: /send magic link/i }).click();

      // HTML5 validation should prevent submission
      expect(page.url()).toContain('/login');
    });

    test('should show error for missing email', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling email
      await page.getByRole('button', { name: /send magic link/i }).click();

      // Check for validation (browser's built-in validation will handle this)
      const emailInput = page.getByLabel(/email address/i);
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
        return !el.checkValidity();
      });

      expect(isInvalid).toBeTruthy();
    });

    test('should show success message after requesting magic link', async ({ page }) => {
      await page.goto('/login');

      // Fill in email
      const testEmail = `test-login-${Date.now()}@example.com`;
      await page.getByLabel(/email address/i).fill(testEmail);

      // Submit form
      await page.getByRole('button', { name: /send magic link/i }).click();

      // Should show success state
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({
        timeout: 10000,
      });

      // Should show the email we entered
      await expect(page.getByText(testEmail)).toBeVisible();

      // Should show instruction message
      await expect(page.getByText(/click the link in the email to sign in/i)).toBeVisible();
    });

    test('should show loading state while sending magic link', async ({ page }) => {
      await page.goto('/login');

      // Fill in email
      await page.getByLabel(/email address/i).fill('test@example.com');

      // Click submit
      await page.getByRole('button', { name: /send magic link/i }).click();

      // Should show loading text (this might be very brief)
      await expect(
        page.getByRole('button', { name: /sending magic link/i }).or(
          page.getByRole('heading', { name: /check your email/i })
        )
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      // Try to access protected dashboard route
      await page.goto('/dashboard');

      // Should redirect to login or auth page
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });

      // Verify we're on login/auth page
      expect(page.url()).toMatch(/\/(login|auth)/);
    });

    test('should redirect when accessing properties without auth', async ({ page }) => {
      // Try to access properties page
      await page.goto('/dashboard/properties');

      // Should redirect to login
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });

    test('should redirect when accessing reservations without auth', async ({ page }) => {
      // Try to access reservations page
      await page.goto('/dashboard/reservations');

      // Should redirect to login
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });
  });

  test.describe('Navigation Between Auth Pages', () => {
    test('should navigate from login to signup', async ({ page }) => {
      await page.goto('/login');

      // Click sign up link
      await page.getByRole('link', { name: /sign up/i }).click();

      // Should navigate to signup page
      await page.waitForURL(/\/signup/, { timeout: 5000 });
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    });

    test('should navigate from signup to login', async ({ page }) => {
      await page.goto('/signup');

      // Click sign in link
      await page.getByRole('link', { name: /sign in/i }).click();

      // Should navigate to login page
      await page.waitForURL(/\/login/, { timeout: 5000 });
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    // Note: These tests would require actual authentication
    // For now, we'll test the sign out route existence

    test('should have signout route available', async ({ page }) => {
      await page.goto('/auth/signout');

      // Should redirect somewhere (either to home or login)
      await page.waitForURL(/\/(login|auth|$)/, { timeout: 5000 });

      // Verify we're not on a protected route
      expect(page.url()).not.toContain('/dashboard');
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have proper labels on signup form', async ({ page }) => {
      await page.goto('/signup');

      // Check that all inputs have proper labels
      const fullNameInput = page.getByLabel(/full name/i);
      const orgNameInput = page.getByLabel(/organization name/i);
      const emailInput = page.getByLabel(/email address/i);

      await expect(fullNameInput).toHaveAttribute('id');
      await expect(orgNameInput).toHaveAttribute('id');
      await expect(emailInput).toHaveAttribute('id');

      // Check aria-labels
      await expect(fullNameInput).toHaveAttribute('aria-label', /full name/i);
      await expect(orgNameInput).toHaveAttribute('aria-label', /organization name/i);
      await expect(emailInput).toHaveAttribute('aria-label', /email address/i);
    });

    test('should have proper labels on login form', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel(/email address/i);

      await expect(emailInput).toHaveAttribute('id');
      await expect(emailInput).toHaveAttribute('aria-label', /email address/i);
    });

    test('should show error messages with role="alert"', async ({ page }) => {
      await page.goto('/signup');

      // Trigger validation error
      await page.getByLabel(/full name/i).fill('A');
      await page.getByLabel(/organization name/i).fill('Test Org');
      await page.getByLabel(/email address/i).fill('test@example.com');
      await page.getByRole('button', { name: /create account/i }).click();

      // Error should have role="alert"
      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      await expect(alert).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Form State Management', () => {
    test('should disable form during submission', async ({ page }) => {
      await page.goto('/signup');

      // Fill in form
      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/organization name/i).fill('Test Organization');
      await page.getByLabel(/email address/i).fill('test@example.com');

      // Submit form
      const submitButton = page.getByRole('button', { name: /create account/i });
      await submitButton.click();

      // Inputs should be disabled during submission
      // (This might be brief, so we check for either disabled state or success state)
      await expect(
        page.getByLabel(/full name/i).and(page.locator('[disabled]')).or(
          page.getByRole('heading', { name: /check your email/i })
        )
      ).toBeVisible({ timeout: 5000 });
    });

    test('should preserve email in success message', async ({ page }) => {
      await page.goto('/login');

      const testEmail = 'preserve-test@example.com';
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByRole('button', { name: /send magic link/i }).click();

      // Wait for success
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();

      // Email should be displayed
      await expect(page.getByText(testEmail, { exact: true })).toBeVisible();
    });
  });
});
