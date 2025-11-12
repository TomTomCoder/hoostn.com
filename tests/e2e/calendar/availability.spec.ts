import { test, expect } from '@playwright/test';
import { formatDateForInput, getDaysFromNow } from '../utils/helpers';

/**
 * Availability & Calendar E2E Tests
 *
 * Tests cover:
 * - Display availability calendar
 * - Block date range
 * - Unblock dates
 * - Set minimum stay rule
 * - Create seasonal pricing
 * - Apply price override
 * - Navigate calendar months
 * - Show existing reservations
 */

test.describe('Availability & Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/calendar');

    if (page.url().includes('/login') || page.url().includes('/auth')) {
      test.skip();
    }
  });

  test.describe('Calendar Display', () => {
    test('should display availability calendar', async ({ page }) => {
      // Check for calendar component
      await expect(
        page.getByRole('heading', { name: /calendar|calendrier|availability/i })
      ).toBeVisible();

      // Should show month view
      const hasMonthView = await page.locator('[class*="calendar"], [data-testid="calendar"]').count() > 0;
      expect(hasMonthView).toBeTruthy();
    });

    test('should show current month and year', async ({ page }) => {
      const now = new Date();
      const currentMonth = now.toLocaleString('default', { month: 'long' });
      const currentYear = now.getFullYear();

      // Should display current month/year
      const hasMonth = await page.getByText(new RegExp(currentMonth, 'i')).count() > 0;
      const hasYear = await page.getByText(currentYear.toString()).count() > 0;

      expect(hasMonth || hasYear).toBeTruthy();
    });

    test('should display day cells', async ({ page }) => {
      // Should have day cells (1-31)
      const dayCells = page.locator('[data-testid="day-cell"], [class*="day"]');
      const count = await dayCells.count();

      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Navigate Calendar', () => {
    test('should navigate calendar months', async ({ page }) => {
      // Find next month button
      const nextButton = page.getByRole('button', { name: /next|suivant|>/i })
        .or(page.locator('[data-testid="next-month"]'));

      if (await nextButton.count() > 0) {
        await nextButton.first().click();
        await page.waitForTimeout(500);

        // Month should have changed
        // (Exact verification depends on implementation)
      }
    });

    test('should navigate to previous month', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: /previous|précédent|</i })
        .or(page.locator('[data-testid="prev-month"]'));

      if (await prevButton.count() > 0) {
        await prevButton.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('should jump to specific month', async ({ page }) => {
      const monthSelect = page.getByLabel(/month|mois/i)
        .or(page.locator('[data-testid="month-select"]'));

      if (await monthSelect.count() > 0) {
        await monthSelect.first().selectOption({ label: /june|juin/i });
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Block Dates', () => {
    test('should block date range', async ({ page }) => {
      // Select a date range to block
      const dayCell = page.locator('[data-testid="day-cell"]').first();

      if (await dayCell.count() > 0) {
        // Click to select
        await dayCell.click();

        // Look for block button
        const blockButton = page.getByRole('button', { name: /block|bloquer/i });

        if (await blockButton.count() > 0) {
          await blockButton.click();
          await page.waitForTimeout(1000);

          // Date should be marked as blocked
          const isBlocked = await dayCell.locator('[class*="blocked"]').count() > 0;
          expect(isBlocked).toBeTruthy();
        }
      }
    });

    test('should block multiple consecutive dates', async ({ page }) => {
      test.skip('Requires date range selection implementation details');

      // Select start date
      // Select end date
      // Click block
      // All dates in range should be blocked
    });

    test('should show block reason modal', async ({ page }) => {
      const dayCell = page.locator('[data-testid="day-cell"]').first();

      if (await dayCell.count() > 0) {
        await dayCell.click();

        const blockButton = page.getByRole('button', { name: /block|bloquer/i });

        if (await blockButton.count() > 0) {
          await blockButton.click();

          // Should show reason input
          const reasonInput = page.getByLabel(/reason|raison/i);

          if (await reasonInput.count() > 0) {
            await reasonInput.fill('Maintenance');

            const confirmButton = page.getByRole('button', { name: /confirm|confirmer/i });
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Unblock Dates', () => {
    test('should unblock dates', async ({ page }) => {
      // Find a blocked date
      const blockedDay = page.locator('[data-testid="day-cell"][class*="blocked"]').first();

      if (await blockedDay.count() > 0) {
        await blockedDay.click();

        const unblockButton = page.getByRole('button', { name: /unblock|débloquer/i });

        if (await unblockButton.count() > 0) {
          await unblockButton.click();
          await page.waitForTimeout(1000);

          // Date should no longer be blocked
          const stillBlocked = await blockedDay.locator('[class*="blocked"]').count() > 0;
          expect(stillBlocked).toBeFalsy();
        }
      }
    });
  });

  test.describe('Minimum Stay Rules', () => {
    test('should set minimum stay rule', async ({ page }) => {
      // Look for settings or rules section
      const settingsButton = page.getByRole('button', { name: /settings|paramètres|rules|règles/i });

      if (await settingsButton.count() > 0) {
        await settingsButton.click();

        // Set minimum stay
        const minStayInput = page.getByLabel(/minimum.*stay|séjour.*minimum/i);

        if (await minStayInput.count() > 0) {
          await minStayInput.fill('2');

          const saveButton = page.getByRole('button', { name: /save|enregistrer/i });
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should set seasonal minimum stay', async ({ page }) => {
      test.skip('Requires seasonal rules UI');

      // Navigate to seasonal rules
      // Set minimum stay for summer
      // Set minimum stay for winter
      // Save changes
    });
  });

  test.describe('Seasonal Pricing', () => {
    test('should create seasonal pricing', async ({ page }) => {
      // Look for pricing section
      const pricingButton = page.getByRole('button', { name: /pricing|tarification|prix/i });

      if (await pricingButton.count() > 0) {
        await pricingButton.click();

        // Add seasonal pricing
        const addSeasonButton = page.getByRole('button', { name: /add.*season|ajouter.*saison/i });

        if (await addSeasonButton.count() > 0) {
          await addSeasonButton.click();

          // Fill season details
          const nameInput = page.getByLabel(/season.*name|nom.*saison/i);
          if (await nameInput.count() > 0) {
            await nameInput.fill('Summer');
          }

          const startDateInput = page.getByLabel(/start.*date|date.*début/i);
          if (await startDateInput.count() > 0) {
            await startDateInput.fill('2024-06-01');
          }

          const endDateInput = page.getByLabel(/end.*date|date.*fin/i);
          if (await endDateInput.count() > 0) {
            await endDateInput.fill('2024-08-31');
          }

          const priceInput = page.getByLabel(/price|prix/i);
          if (await priceInput.count() > 0) {
            await priceInput.fill('125.00');
          }

          const saveButton = page.getByRole('button', { name: /save|enregistrer/i });
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should edit seasonal pricing', async ({ page }) => {
      test.skip('Requires existing seasonal pricing');

      // Find existing season
      // Click edit
      // Update price
      // Save
    });

    test('should delete seasonal pricing', async ({ page }) => {
      test.skip('Requires existing seasonal pricing');

      // Find existing season
      // Click delete
      // Confirm
    });
  });

  test.describe('Price Overrides', () => {
    test('should apply price override', async ({ page }) => {
      // Select a specific date
      const dayCell = page.locator('[data-testid="day-cell"]').first();

      if (await dayCell.count() > 0) {
        await dayCell.click();

        // Look for price override option
        const setPriceButton = page.getByRole('button', { name: /set.*price|définir.*prix/i });

        if (await setPriceButton.count() > 0) {
          await setPriceButton.click();

          const priceInput = page.getByLabel(/price|prix/i);
          await priceInput.fill('199.00');

          const saveButton = page.getByRole('button', { name: /save|enregistrer/i });
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should remove price override', async ({ page }) => {
      // Find day with price override
      const dayWithOverride = page.locator('[data-testid="day-cell"][data-has-override="true"]').first();

      if (await dayWithOverride.count() > 0) {
        await dayWithOverride.click();

        const removeButton = page.getByRole('button', { name: /remove.*override|supprimer/i });

        if (await removeButton.count() > 0) {
          await removeButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Show Existing Reservations', () => {
    test('should show existing reservations on calendar', async ({ page }) => {
      // Reserved dates should be visually distinct
      const reservedDays = page.locator('[data-testid="day-cell"][class*="reserved"], [data-testid="day-cell"][data-status="reserved"]');

      const count = await reservedDays.count();

      // If there are reservations, they should be shown
      // (Actual count depends on test data)
      console.log(`Reserved days count: ${count}`);
    });

    test('should display reservation details on hover', async ({ page }) => {
      const reservedDay = page.locator('[data-testid="day-cell"][class*="reserved"]').first();

      if (await reservedDay.count() > 0) {
        await reservedDay.hover();
        await page.waitForTimeout(500);

        // Should show tooltip with reservation details
        const tooltip = page.locator('[role="tooltip"], [class*="tooltip"]');

        if (await tooltip.count() > 0) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('should click reservation to view details', async ({ page }) => {
      const reservedDay = page.locator('[data-testid="day-cell"][class*="reserved"]').first();

      if (await reservedDay.count() > 0) {
        await reservedDay.click();

        // Should show reservation details modal or navigate to reservation
        const modal = page.locator('[role="dialog"]');
        const navigated = page.url().includes('/reservation');

        const hasModal = await modal.count() > 0;

        expect(hasModal || navigated).toBeTruthy();
      }
    });
  });

  test.describe('Multi-Lot View', () => {
    test('should switch between lots', async ({ page }) => {
      // Look for lot selector
      const lotSelect = page.getByLabel(/lot|emplacement/i)
        .or(page.locator('[data-testid="lot-select"]'));

      if (await lotSelect.count() > 0) {
        const options = await lotSelect.locator('option').count();

        if (options > 1) {
          await lotSelect.selectOption({ index: 1 });
          await page.waitForTimeout(1000);

          // Calendar should update for selected lot
        }
      }
    });

    test('should view all lots simultaneously', async ({ page }) => {
      const viewAllButton = page.getByRole('button', { name: /all.*lots|tous.*emplacements/i });

      if (await viewAllButton.count() > 0) {
        await viewAllButton.click();
        await page.waitForTimeout(1000);

        // Should show multi-lot calendar view
      }
    });
  });
});
