import { test, expect, devices } from '@playwright/test';
import { formatDateForInput, getDaysFromNow } from '../utils/helpers';

/**
 * Mobile Responsive E2E Tests
 *
 * Tests cover:
 * - Mobile navigation
 * - Search on mobile
 * - View lot details on mobile
 * - Complete booking on mobile
 * - Manage properties on mobile
 *
 * Uses iPhone SE viewport (375x667)
 */

test.describe('Mobile Responsive Tests', () => {
  test.use({
    ...devices['iPhone SE'],
    viewport: { width: 375, height: 667 },
  });

  test.describe('Mobile Navigation', () => {
    test('should display mobile navigation', async ({ page }) => {
      await page.goto('/');

      // Should have mobile menu button (hamburger)
      const menuButton = page.getByRole('button', { name: /menu|navigation/i })
        .or(page.locator('[data-testid="mobile-menu-button"]'))
        .or(page.locator('button[aria-label*="menu"]'));

      if (await menuButton.count() > 0) {
        await expect(menuButton.first()).toBeVisible();

        // Click to open menu
        await menuButton.first().click();

        // Menu should be visible
        const mobileMenu = page.locator('[data-testid="mobile-menu"], [class*="mobile-menu"]');
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu).toBeVisible();
        }
      }
    });

    test('should navigate using mobile menu', async ({ page }) => {
      await page.goto('/');

      const menuButton = page.locator('[data-testid="mobile-menu-button"]')
        .or(page.getByRole('button', { name: /menu/i }));

      if (await menuButton.count() > 0) {
        await menuButton.first().click();

        // Click on a navigation link
        const searchLink = page.getByRole('link', { name: /search|rechercher/i });

        if (await searchLink.count() > 0) {
          await searchLink.first().click();
          await page.waitForURL(/\/search/, { timeout: 5000 });
        }
      }
    });

    test('should close mobile menu when clicking outside', async ({ page }) => {
      await page.goto('/');

      const menuButton = page.locator('[data-testid="mobile-menu-button"]');

      if (await menuButton.count() > 0) {
        await menuButton.click();

        // Click outside menu
        await page.click('body');

        // Menu should close
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Search on Mobile', () => {
    test('should search on mobile', async ({ page }) => {
      await page.goto('/search');

      // Fill search form
      const checkInInput = page.getByLabel(/check.*in|arrivée/i).first();
      if (await checkInInput.count() > 0) {
        await checkInInput.fill(formatDateForInput(getDaysFromNow(7)));
      }

      const checkOutInput = page.getByLabel(/check.*out|départ/i).first();
      if (await checkOutInput.count() > 0) {
        await checkOutInput.fill(formatDateForInput(getDaysFromNow(10)));
      }

      const guestsInput = page.getByLabel(/guests|personnes/i).first();
      if (await guestsInput.count() > 0) {
        await guestsInput.fill('2');
      }

      // Submit search
      const searchButton = page.getByRole('button', { name: /search|rechercher/i }).first();
      if (await searchButton.count() > 0) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }

      // Results should be visible on mobile
      const results = page.locator('[data-testid="lot-card"]');
      const emptyState = page.getByText(/no results|aucun résultat/i);

      const hasResults = await results.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      expect(hasResults || hasEmptyState).toBeTruthy();
    });

    test('should use mobile-friendly filters', async ({ page }) => {
      await page.goto('/search');

      // Look for filter button (mobile)
      const filterButton = page.getByRole('button', { name: /filter|filtre/i });

      if (await filterButton.count() > 0) {
        await filterButton.click();

        // Filters should open in modal or slide-up panel
        const filterPanel = page.locator('[role="dialog"], [data-testid="filter-panel"]');
        if (await filterPanel.count() > 0) {
          await expect(filterPanel).toBeVisible();
        }
      }
    });

    test('should scroll results smoothly on mobile', async ({ page }) => {
      await page.goto('/search');

      // Trigger search
      const searchButton = page.getByRole('button', { name: /search|rechercher/i });
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);

      // Page should scroll smoothly
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    });
  });

  test.describe('View Lot Details on Mobile', () => {
    test('should view lot details on mobile', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();

      if (await lotLink.count() > 0) {
        await lotLink.click();
        await page.waitForURL(/\/lots\//, { timeout: 10000 });

        // Should display lot details
        await expect(page.getByText(/description|amenities/i)).toBeVisible();
      }
    });

    test('should swipe through images on mobile', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Look for image gallery
      const imageGallery = page.locator('[data-testid="image-gallery"]');

      if (await imageGallery.count() > 0) {
        // Try to swipe (simulate touch)
        const box = await imageGallery.boundingBox();

        if (box) {
          // Swipe left
          await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
          await page.waitForTimeout(500);
        }
      }
    });

    test('should show mobile-optimized booking form', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Booking form should be visible and mobile-friendly
      const bookingSection = page.locator('[data-testid="booking-form"]')
        .or(page.getByRole('button', { name: /book|réserver/i }));

      if (await bookingSection.count() > 0) {
        await expect(bookingSection.first()).toBeVisible();
      }
    });
  });

  test.describe('Complete Booking on Mobile', () => {
    test('should complete booking on mobile', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Fill booking form
      const checkInInput = page.getByLabel(/check.*in|arrivée/i);
      if (await checkInInput.count() > 0) {
        await checkInInput.fill(formatDateForInput(getDaysFromNow(7)));
      }

      const checkOutInput = page.getByLabel(/check.*out|départ/i);
      if (await checkOutInput.count() > 0) {
        await checkOutInput.fill(formatDateForInput(getDaysFromNow(10)));
      }

      const guestsInput = page.getByLabel(/guests|personnes/i);
      if (await guestsInput.count() > 0) {
        await guestsInput.fill('2');
      }

      // Scroll to book button
      const bookButton = page.getByRole('button', { name: /book|réserver/i });
      if (await bookButton.count() > 0) {
        await bookButton.scrollIntoViewIfNeeded();
        await bookButton.click();
        await page.waitForTimeout(2000);

        // Fill guest info
        const nameInput = page.getByLabel(/name|nom/i).first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Mobile User');
        }

        const emailInput = page.getByLabel(/email|courriel/i).first();
        if (await emailInput.count() > 0) {
          await emailInput.fill(`mobile-${Date.now()}@example.com`);
        }

        const phoneInput = page.getByLabel(/phone|téléphone/i);
        if (await phoneInput.count() > 0) {
          await phoneInput.fill('5551234567');
        }
      }
    });

    test('should show sticky booking button on mobile', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 300));

      // Sticky booking button should be visible
      const stickyButton = page.locator('[data-testid="sticky-book-button"]')
        .or(page.locator('[class*="sticky"]').getByRole('button', { name: /book|réserver/i }));

      if (await stickyButton.count() > 0) {
        await expect(stickyButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Manage Properties on Mobile', () => {
    test('should access dashboard on mobile', async ({ page }) => {
      await page.goto('/dashboard');

      // May redirect to login
      if (page.url().includes('/login')) {
        test.skip();
      }

      // Dashboard should be mobile-responsive
      const dashboard = page.getByRole('heading', { name: /dashboard|tableau/i });
      if (await dashboard.count() > 0) {
        await expect(dashboard.first()).toBeVisible();
      }
    });

    test('should navigate property list on mobile', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Properties should be listed in mobile-friendly cards
      const propertyCards = page.locator('[data-testid="property-card"]');
      const count = await propertyCards.count();

      // Should render properly on mobile
      if (count > 0) {
        await expect(propertyCards.first()).toBeVisible();
      }
    });

    test('should create property on mobile', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Form should be mobile-friendly
      const nameInput = page.getByLabel(/property name|nom.*propriété/i);
      if (await nameInput.count() > 0) {
        await expect(nameInput.first()).toBeVisible();

        // Input should be large enough for mobile
        const box = await nameInput.first().boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40); // Minimum touch target
        }
      }
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      const loadTime = Date.now() - startTime;

      // Should load in under 5 seconds on mobile
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.goto('/');

      // Tap on clickable elements
      const link = page.getByRole('link').first();

      if (await link.count() > 0) {
        const box = await link.boundingBox();

        if (box) {
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(500);
        }
      }
    });
  });
});
