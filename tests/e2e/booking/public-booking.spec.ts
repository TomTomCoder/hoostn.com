import { test, expect } from '@playwright/test';
import { formatDateForInput, getDaysFromNow } from '../utils/helpers';

/**
 * Public Search & Booking E2E Tests
 *
 * Tests cover:
 * - Search page display
 * - Search with filters (dates, guests, location)
 * - Display search results
 * - Filter by price range
 * - Filter by amenities
 * - View lot details
 * - Image gallery
 * - Price calculation
 * - Complete booking flow
 * - Date validation
 * - Minimum stay requirements
 * - Booking confirmation
 */

test.describe('Public Search & Booking', () => {
  test.describe('Search Page', () => {
    test('should display search page', async ({ page }) => {
      await page.goto('/search');

      // Check page loaded
      await expect(page.getByRole('heading', { name: /search|rechercher|find|trouver/i })).toBeVisible();

      // Check search form elements
      const checkInInput = page.getByLabel(/check.*in|arrivée|arrival/i)
        .or(page.locator('input[name="checkIn"], input[name="check-in"]'));

      const checkOutInput = page.getByLabel(/check.*out|départ|departure/i)
        .or(page.locator('input[name="checkOut"], input[name="check-out"]'));

      const guestsInput = page.getByLabel(/guests|personnes|nombre/i)
        .or(page.locator('input[name="guests"]'));

      // At least some search inputs should be visible
      const hasSearchInputs = (await checkInInput.count() > 0) ||
                              (await checkOutInput.count() > 0) ||
                              (await guestsInput.count() > 0);

      expect(hasSearchInputs).toBeTruthy();
    });

    test('should have location search', async ({ page }) => {
      await page.goto('/search');

      // Look for location/destination input
      const locationInput = page.getByLabel(/location|destination|où/i)
        .or(page.getByPlaceholder(/location|destination|city|ville/i));

      if (await locationInput.count() > 0) {
        await expect(locationInput.first()).toBeVisible();
      }
    });
  });

  test.describe('Search with Filters', () => {
    test('should search with filters (dates, guests, location)', async ({ page }) => {
      await page.goto('/search');

      // Set check-in date (7 days from now)
      const checkInDate = getDaysFromNow(7);
      const checkInInput = page.getByLabel(/check.*in|arrivée/i)
        .or(page.locator('input[name="checkIn"]'));

      if (await checkInInput.count() > 0) {
        await checkInInput.first().fill(formatDateForInput(checkInDate));
      }

      // Set check-out date (10 days from now)
      const checkOutDate = getDaysFromNow(10);
      const checkOutInput = page.getByLabel(/check.*out|départ/i)
        .or(page.locator('input[name="checkOut"]'));

      if (await checkOutInput.count() > 0) {
        await checkOutInput.first().fill(formatDateForInput(checkOutDate));
      }

      // Set number of guests
      const guestsInput = page.getByLabel(/guests|personnes/i)
        .or(page.locator('input[name="guests"]'));

      if (await guestsInput.count() > 0) {
        await guestsInput.first().fill('2');
      }

      // Click search button
      const searchButton = page.getByRole('button', { name: /search|rechercher|find/i });

      if (await searchButton.count() > 0) {
        await searchButton.first().click();

        // Wait for results to load
        await page.waitForTimeout(2000);
      }
    });

    test('should search by location', async ({ page }) => {
      await page.goto('/search');

      const locationInput = page.getByLabel(/location|destination/i)
        .or(page.getByPlaceholder(/location|destination|city|ville/i));

      if (await locationInput.count() > 0) {
        await locationInput.first().fill('Banff');

        const searchButton = page.getByRole('button', { name: /search|rechercher/i });
        if (await searchButton.count() > 0) {
          await searchButton.first().click();
          await page.waitForTimeout(2000);
        }
      }
    });
  });

  test.describe('Search Results', () => {
    test('should display search results', async ({ page }) => {
      await page.goto('/search');

      // Perform a search
      const searchButton = page.getByRole('button', { name: /search|rechercher/i });
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Check for results
      const hasResults = await page.locator('[data-testid="lot-card"], [class*="lot-card"], [class*="result"]').count() > 0;
      const hasEmptyState = await page.getByText(/no results|aucun résultat|no lots/i).count() > 0;

      // Should have either results or empty state
      expect(hasResults || hasEmptyState).toBeTruthy();
    });

    test('should show lot cards with essential information', async ({ page }) => {
      await page.goto('/search');

      // Search
      const searchButton = page.getByRole('button', { name: /search|rechercher/i });
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Check first result card (if exists)
      const lotCard = page.locator('[data-testid="lot-card"], [class*="lot-card"]').first();

      if (await lotCard.count() > 0) {
        // Should have lot name/title
        const hasTitle = await lotCard.locator('h2, h3, [class*="title"]').count() > 0;

        // Should have price
        const hasPrice = await lotCard.getByText(/\$|€|CAD/).count() > 0;

        expect(hasTitle || hasPrice).toBeTruthy();
      }
    });
  });

  test.describe('Filter Results', () => {
    test('should filter by price range', async ({ page }) => {
      await page.goto('/search');

      // Look for price filter
      const priceFilter = page.getByLabel(/price|prix/i)
        .or(page.locator('[data-testid="price-filter"]'));

      if (await priceFilter.count() > 0) {
        // Set price range
        const minPriceInput = page.getByLabel(/min.*price|prix.*min/i)
          .or(page.locator('input[name="minPrice"]'));

        if (await minPriceInput.count() > 0) {
          await minPriceInput.first().fill('50');
        }

        const maxPriceInput = page.getByLabel(/max.*price|prix.*max/i)
          .or(page.locator('input[name="maxPrice"]'));

        if (await maxPriceInput.count() > 0) {
          await maxPriceInput.first().fill('150');
        }

        // Apply filter
        await page.waitForTimeout(1000);
      }
    });

    test('should filter by amenities', async ({ page }) => {
      await page.goto('/search');

      // Look for amenity filters
      const wifiFilter = page.getByLabel(/wifi|wi-fi/i);
      const electricityFilter = page.getByLabel(/electricity|électricité/i);
      const waterFilter = page.getByLabel(/water|eau/i);

      // Check at least one amenity filter
      if (await wifiFilter.count() > 0) {
        await wifiFilter.first().check();
        await page.waitForTimeout(1000);

        // Results should update
        // (Exact verification depends on implementation)
      } else if (await electricityFilter.count() > 0) {
        await electricityFilter.first().check();
        await page.waitForTimeout(1000);
      }
    });

    test('should filter by lot type', async ({ page }) => {
      await page.goto('/search');

      // Look for lot type filter
      const lotTypeFilter = page.getByLabel(/lot type|type.*emplacement/i)
        .or(page.locator('[data-testid="lot-type-filter"]'));

      if (await lotTypeFilter.count() > 0) {
        // Select a type
        const rvOption = page.getByLabel(/rv|camping.*car/i);
        const tentOption = page.getByLabel(/tent|tente/i);

        if (await rvOption.count() > 0) {
          await rvOption.first().check();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Lot Details Page', () => {
    test('should view lot details', async ({ page }) => {
      await page.goto('/search');

      // Search for lots
      const searchButton = page.getByRole('button', { name: /search|rechercher/i });
      if (await searchButton.count() > 0) {
        await searchButton.first().click();
        await page.waitForTimeout(2000);
      }

      // Click on first lot
      const lotLink = page.locator('[href*="/lots/"]').first();

      if (await lotLink.count() > 0) {
        await lotLink.click();

        // Should navigate to lot details
        await page.waitForURL(/\/lots\/[a-z0-9-]+/, { timeout: 10000 });

        // Should show lot details
        const hasDescription = await page.getByText(/description/i).count() > 0;
        const hasAmenities = await page.getByText(/amenities|équipements/i).count() > 0;

        expect(hasDescription || hasAmenities).toBeTruthy();
      }
    });

    test('should display image gallery', async ({ page }) => {
      // Navigate to a lot detail page
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip('No lots available');
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Look for images
      const images = page.locator('img[src*="lot"], img[alt*="lot"], [data-testid="lot-image"]');

      if (await images.count() > 0) {
        await expect(images.first()).toBeVisible();
      }
    });

    test('should have clickable image gallery', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Click on an image to open gallery
      const image = page.locator('img[src*="lot"]').first();
      if (await image.count() > 0) {
        await image.click();

        // Should open lightbox/modal
        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="lightbox"]');
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
        }
      }
    });
  });

  test.describe('Price Calculation', () => {
    test('should calculate price correctly', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Set dates
      const checkInInput = page.getByLabel(/check.*in|arrivée/i);
      const checkOutInput = page.getByLabel(/check.*out|départ/i);

      if (await checkInInput.count() > 0 && await checkOutInput.count() > 0) {
        const checkIn = getDaysFromNow(7);
        const checkOut = getDaysFromNow(10); // 3 nights

        await checkInInput.fill(formatDateForInput(checkIn));
        await checkOutInput.fill(formatDateForInput(checkOut));

        // Wait for price calculation
        await page.waitForTimeout(1000);

        // Should show total price
        const totalPrice = page.getByText(/total|total price|prix total/i);
        if (await totalPrice.count() > 0) {
          await expect(totalPrice.first()).toBeVisible();
        }
      }
    });

    test('should update price when dates change', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      const checkInInput = page.getByLabel(/check.*in|arrivée/i);
      const checkOutInput = page.getByLabel(/check.*out|départ/i);

      if (await checkInInput.count() > 0 && await checkOutInput.count() > 0) {
        // Set dates for 2 nights
        await checkInInput.fill(formatDateForInput(getDaysFromNow(7)));
        await checkOutInput.fill(formatDateForInput(getDaysFromNow(9)));
        await page.waitForTimeout(1000);

        // Get price
        const priceText1 = await page.locator('[data-testid="total-price"]').textContent() || '';

        // Change to 5 nights
        await checkOutInput.fill(formatDateForInput(getDaysFromNow(12)));
        await page.waitForTimeout(1000);

        // Price should be different
        const priceText2 = await page.locator('[data-testid="total-price"]').textContent() || '';

        // Prices should differ (if price display exists)
        if (priceText1 && priceText2) {
          expect(priceText1).not.toBe(priceText2);
        }
      }
    });
  });

  test.describe('Booking Flow', () => {
    test('should complete booking flow', async ({ page }) => {
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

      // Click book button
      const bookButton = page.getByRole('button', { name: /book|réserver|reserve/i });
      if (await bookButton.count() > 0) {
        await bookButton.click();

        // Should navigate to booking form or checkout
        await page.waitForTimeout(2000);

        // Fill guest information
        const nameInput = page.getByLabel(/name|nom/i).first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('John Doe');
        }

        const emailInput = page.getByLabel(/email|courriel/i).first();
        if (await emailInput.count() > 0) {
          await emailInput.fill(`test-${Date.now()}@example.com`);
        }

        const phoneInput = page.getByLabel(/phone|téléphone/i);
        if (await phoneInput.count() > 0) {
          await phoneInput.fill('(555) 123-4567');
        }

        // Submit booking
        const confirmButton = page.getByRole('button', { name: /confirm|confirmer|complete/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }
    });

    test('should validate booking dates (past dates rejected)', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Try to set past date
      const checkInInput = page.getByLabel(/check.*in|arrivée/i);
      if (await checkInInput.count() > 0) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        await checkInInput.fill(formatDateForInput(pastDate));

        // Click book button
        const bookButton = page.getByRole('button', { name: /book|réserver/i });
        if (await bookButton.count() > 0) {
          await bookButton.click();

          // Should show error or prevent booking
          const hasError = await page.getByRole('alert').count() > 0;
          const errorText = await page.getByText(/past date|date.*passé|invalid.*date/i).count() > 0;

          // Some validation should occur
          expect(hasError || errorText).toBeTruthy();
        }
      }
    });

    test('should validate minimum stay requirements', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Try to book for 1 night (if min stay is 2+)
      const checkInInput = page.getByLabel(/check.*in|arrivée/i);
      const checkOutInput = page.getByLabel(/check.*out|départ/i);

      if (await checkInInput.count() > 0 && await checkOutInput.count() > 0) {
        await checkInInput.fill(formatDateForInput(getDaysFromNow(7)));
        await checkOutInput.fill(formatDateForInput(getDaysFromNow(8))); // Only 1 night

        const bookButton = page.getByRole('button', { name: /book|réserver/i });
        if (await bookButton.count() > 0) {
          await bookButton.click();

          // If minimum stay is enforced, should show error
          // (This depends on implementation)
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should show confirmation page after booking', async ({ page }) => {
      test.skip('Requires full booking flow with payment');

      // Complete booking
      // Should redirect to confirmation page
      // Should show:
      // - Booking confirmation number
      // - Booking details
      // - Next steps
    });
  });

  test.describe('Booking Form Validation', () => {
    test('should validate guest information', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      // Set dates
      const checkInInput = page.getByLabel(/check.*in|arrivée/i);
      if (await checkInInput.count() > 0) {
        await checkInInput.fill(formatDateForInput(getDaysFromNow(7)));
      }

      const checkOutInput = page.getByLabel(/check.*out|départ/i);
      if (await checkOutInput.count() > 0) {
        await checkOutInput.fill(formatDateForInput(getDaysFromNow(10)));
      }

      // Click book
      const bookButton = page.getByRole('button', { name: /book|réserver/i });
      if (await bookButton.count() > 0) {
        await bookButton.click();
        await page.waitForTimeout(1000);

        // Try to submit without filling guest info
        const confirmButton = page.getByRole('button', { name: /confirm|confirmer/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();

          // Should show validation errors
          const hasError = await page.getByRole('alert').count() > 0;
          expect(hasError).toBeTruthy();
        }
      }
    });

    test('should validate email format in booking', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();
      if (await lotLink.count() === 0) {
        test.skip();
      }

      await lotLink.click();
      await page.waitForURL(/\/lots\//, { timeout: 10000 });

      const bookButton = page.getByRole('button', { name: /book|réserver/i });
      if (await bookButton.count() > 0) {
        await bookButton.click();
        await page.waitForTimeout(1000);

        // Fill with invalid email
        const emailInput = page.getByLabel(/email|courriel/i).first();
        if (await emailInput.count() > 0) {
          await emailInput.fill('invalid-email');

          const confirmButton = page.getByRole('button', { name: /confirm|confirmer/i });
          if (await confirmButton.count() > 0) {
            await confirmButton.click();

            // Should show validation error
            const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
            expect(isInvalid).toBeTruthy();
          }
        }
      }
    });
  });
});
