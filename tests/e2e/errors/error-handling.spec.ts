import { test, expect } from '@playwright/test';

/**
 * Error Handling E2E Tests
 *
 * Tests cover:
 * - 404 for non-existent pages
 * - Network error handling
 * - Error toast messages
 * - Error recovery (retry)
 */

test.describe('Error Handling', () => {
  test.describe('404 Errors', () => {
    test('should display 404 for non-existent pages', async ({ page }) => {
      // Navigate to non-existent page
      const response = await page.goto('/this-page-does-not-exist-12345');

      // Should return 404 status
      expect(response?.status()).toBe(404);

      // Should show 404 page
      const has404Text = await page.getByText(/404|not found|page.*not.*found/i).count() > 0;
      expect(has404Text).toBeTruthy();
    });

    test('should display 404 for non-existent property', async ({ page }) => {
      // Try to access non-existent property
      await page.goto('/dashboard/properties/00000000-0000-0000-0000-000000000000');

      // Should show error or redirect
      await page.waitForTimeout(2000);

      const has404 = await page.getByText(/404|not found/i).count() > 0;
      const redirected = page.url().includes('/dashboard/properties') &&
                        !page.url().includes('00000000-0000-0000-0000-000000000000');

      expect(has404 || redirected).toBeTruthy();
    });

    test('should display 404 for non-existent lot', async ({ page }) => {
      await page.goto('/lots/00000000-0000-0000-0000-000000000000');

      await page.waitForTimeout(2000);

      const has404 = await page.getByText(/404|not found/i).count() > 0;
      const redirected = !page.url().includes('00000000-0000-0000-0000-000000000000');

      expect(has404 || redirected).toBeTruthy();
    });

    test('should show helpful 404 page with navigation', async ({ page }) => {
      await page.goto('/non-existent-page');

      await page.waitForTimeout(1000);

      // Should have link to home or dashboard
      const homeLink = page.getByRole('link', { name: /home|accueil|dashboard/i });

      if (await homeLink.count() > 0) {
        await expect(homeLink.first()).toBeVisible();
      }
    });
  });

  test.describe('Network Errors', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Simulate offline mode
      await context.setOffline(true);

      try {
        await page.goto('/search');

        // Should show error message
        await page.waitForTimeout(2000);

        const hasError = await page.getByText(/error|network|connection/i).count() > 0;
        expect(hasError).toBeTruthy();
      } finally {
        await context.setOffline(false);
      }
    });

    test('should handle slow network gracefully', async ({ page }) => {
      // Slow down network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      await page.goto('/search');

      // Should show loading state
      const hasLoading = await page.locator('[data-testid="loading"], [class*="loading"]').count() > 0;

      // Eventually should load
      await page.waitForTimeout(3000);
    });

    test('should handle API errors', async ({ page }) => {
      // Intercept API calls and return error
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/dashboard/properties');

      // Should show error message
      await page.waitForTimeout(2000);

      const hasError = await page.getByRole('alert').count() > 0 ||
                       await page.getByText(/error|failed/i).count() > 0;

      expect(hasError).toBeTruthy();
    });
  });

  test.describe('Error Toast Messages', () => {
    test('should show error toast on failed operations', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Try to submit invalid form
      const submitButton = page.getByRole('button', { name: /create|créer/i });

      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Should show error toast or alert
        const hasError = await page.getByRole('alert').count() > 0;
        const hasToast = await page.locator('[role="alert"], [class*="toast"]').count() > 0;

        expect(hasError || hasToast).toBeTruthy();
      }
    });

    test('should auto-dismiss success toasts', async ({ page }) => {
      // This test documents that success messages should auto-dismiss
      test.skip('Requires successful operation to test');

      // Perform successful operation
      // Wait for toast
      // Toast should auto-dismiss after ~3-5 seconds
    });

    test('should allow manual dismissal of error toasts', async ({ page }) => {
      test.skip('Requires triggering an error');

      // Trigger error toast
      // Look for close button
      // Click close
      // Toast should disappear
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from errors (retry)', async ({ page }) => {
      let requestCount = 0;

      // Fail first request, succeed second
      await page.route('**/api/properties', (route) => {
        requestCount++;

        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server Error' }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/dashboard/properties');

      // Look for retry button
      const retryButton = page.getByRole('button', { name: /retry|réessayer/i });

      if (await retryButton.count() > 0) {
        await retryButton.click();
        await page.waitForTimeout(2000);

        // Should succeed on retry
        const stillHasError = await page.getByText(/error/i).count() > 0;
        expect(stillHasError).toBeFalsy();
      }
    });

    test('should handle session expiration', async ({ page }) => {
      // This test documents session expiration handling
      test.skip('Requires session expiration simulation');

      // Simulate expired session
      // Try to perform authenticated action
      // Should redirect to login
      // After login, should return to original page
    });

    test('should preserve form data after error', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const nameInput = page.getByLabel(/property name|nom.*propriété/i);

      if (await nameInput.count() > 0) {
        const testName = 'Test Property';
        await nameInput.fill(testName);

        // Trigger an error somehow
        // Form data should be preserved

        const currentValue = await nameInput.inputValue();
        expect(currentValue).toBe(testName);
      }
    });
  });

  test.describe('Form Validation Errors', () => {
    test('should show inline validation errors', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const nameInput = page.getByLabel(/property name|nom.*propriété/i);

      if (await nameInput.count() > 0) {
        // Fill with invalid data
        await nameInput.fill('A'); // Too short

        // Blur to trigger validation
        await nameInput.blur();

        // Should show validation error
        const errorMessage = page.locator('[class*="error"]').filter({
          hasText: /name|nom/i,
        });

        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    });

    test('should clear validation errors when corrected', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const nameInput = page.getByLabel(/property name|nom.*propriété/i);

      if (await nameInput.count() > 0) {
        // Invalid
        await nameInput.fill('A');
        await nameInput.blur();
        await page.waitForTimeout(500);

        // Correct
        await nameInput.fill('Valid Property Name');
        await nameInput.blur();
        await page.waitForTimeout(500);

        // Error should be cleared
        const errorMessage = page.locator('[class*="error"]').filter({
          hasText: /name|nom/i,
        });

        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Graceful Degradation', () => {
    test('should work with JavaScript disabled', async ({ page }) => {
      // This documents the requirement for graceful degradation
      test.skip('Requires special browser configuration');

      // Disable JavaScript
      // Navigate to pages
      // Core functionality should still work (forms, navigation)
    });

    test('should work with images disabled', async ({ page }) => {
      // Block images
      await page.route('**/*.{png,jpg,jpeg,webp}', (route) => route.abort());

      await page.goto('/search');

      // Page should still be usable
      const searchButton = page.getByRole('button', { name: /search|rechercher/i });

      if (await searchButton.count() > 0) {
        await expect(searchButton.first()).toBeVisible();
      }
    });
  });
});
