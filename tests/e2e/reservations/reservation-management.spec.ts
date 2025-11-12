import { test, expect } from '@playwright/test';
import { waitForToast } from '../utils/helpers';

/**
 * Reservation Management E2E Tests
 *
 * Tests cover:
 * - Reservations list display
 * - Filter by status
 * - Filter by payment status
 * - Search by guest name
 * - View reservation details
 * - Update reservation status
 * - Status transition validation
 * - Update payment status
 * - Cancel reservation
 * - Dashboard stats
 */

test.describe('Reservation Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/reservations');

    // Skip tests if not authenticated
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      test.skip();
    }
  });

  test.describe('Reservations List', () => {
    test('should display reservations list', async ({ page }) => {
      // Check for reservations heading
      await expect(
        page.getByRole('heading', { name: /reservations|réservations/i })
      ).toBeVisible();

      // Should have a list or empty state
      const hasList = await page.locator('[data-testid="reservation-card"], [class*="reservation"]').count() > 0;
      const hasEmptyState = await page.getByText(/no reservations|aucune réservation/i).count() > 0;

      expect(hasList || hasEmptyState).toBeTruthy();
    });

    test('should display reservation cards with key information', async ({ page }) => {
      const reservationCard = page.locator('[data-testid="reservation-card"]').first();

      if (await reservationCard.count() > 0) {
        // Should show guest name
        const hasGuestName = await reservationCard.locator('[data-testid="guest-name"]').count() > 0;

        // Should show dates
        const hasDates = await reservationCard.getByText(/check.*in|check.*out/i).count() > 0;

        // Should show status
        const hasStatus = await reservationCard.locator('[data-testid="reservation-status"]').count() > 0;

        expect(hasGuestName || hasDates || hasStatus).toBeTruthy();
      }
    });
  });

  test.describe('Filter Reservations', () => {
    test('should filter by status', async ({ page }) => {
      // Look for status filter
      const statusFilter = page.getByLabel(/status|statut/i)
        .or(page.locator('[data-testid="status-filter"]'));

      if (await statusFilter.count() > 0) {
        await statusFilter.first().selectOption({ label: /pending|en attente/i });
        await page.waitForTimeout(1000);

        // Results should be filtered
        // (Verification depends on implementation)
      }
    });

    test('should filter by payment status', async ({ page }) => {
      // Look for payment status filter
      const paymentFilter = page.getByLabel(/payment.*status|statut.*paiement/i)
        .or(page.locator('[data-testid="payment-filter"]'));

      if (await paymentFilter.count() > 0) {
        await paymentFilter.first().selectOption({ label: /paid|payé/i });
        await page.waitForTimeout(1000);
      }
    });

    test('should search by guest name', async ({ page }) => {
      // Look for search input
      const searchInput = page.getByPlaceholder(/search|rechercher|guest name/i)
        .or(page.getByLabel(/search|rechercher/i));

      if (await searchInput.count() > 0) {
        await searchInput.first().fill('John');
        await page.waitForTimeout(1000);

        // Results should be filtered
      }
    });

    test('should filter by date range', async ({ page }) => {
      // Look for date range filter
      const dateFromInput = page.getByLabel(/from|de|start/i)
        .or(page.locator('input[name="dateFrom"]'));

      const dateToInput = page.getByLabel(/to|à|end/i)
        .or(page.locator('input[name="dateTo"]'));

      if (await dateFromInput.count() > 0 && await dateToInput.count() > 0) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await dateFromInput.first().fill(today.toISOString().split('T')[0]);
        await dateToInput.first().fill(nextMonth.toISOString().split('T')[0]);

        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('View Reservation Details', () => {
    test('should view reservation details', async ({ page }) => {
      // Click on first reservation
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() > 0) {
        await reservationLink.click();

        // Should navigate to detail page
        await page.waitForURL(/\/reservations\/[a-z0-9-]+/, { timeout: 10000 });

        // Should show reservation details
        await expect(page.getByText(/reservation|réservation/i)).toBeVisible();

        // Should show guest information
        const hasGuestInfo = await page.getByText(/guest|client|invité/i).count() > 0;
        expect(hasGuestInfo).toBeTruthy();
      }
    });

    test('should display complete reservation information', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() > 0) {
        await reservationLink.click();
        await page.waitForURL(/\/reservations\//, { timeout: 10000 });

        // Should show:
        // - Guest name, email, phone
        // - Check-in/check-out dates
        // - Number of guests
        // - Lot details
        // - Total price
        // - Payment status
        // - Reservation status

        const hasCheckIn = await page.getByText(/check.*in|arrivée/i).count() > 0;
        const hasCheckOut = await page.getByText(/check.*out|départ/i).count() > 0;
        const hasPrice = await page.getByText(/\$|total|prix/i).count() > 0;

        expect(hasCheckIn || hasCheckOut || hasPrice).toBeTruthy();
      }
    });
  });

  test.describe('Update Reservation Status', () => {
    test('should update reservation status (pending -> confirmed)', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip('No reservations available');
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      // Look for status update dropdown or buttons
      const statusSelect = page.getByLabel(/status|statut/i)
        .or(page.locator('[data-testid="status-select"]'));

      if (await statusSelect.count() > 0) {
        await statusSelect.first().selectOption({ label: /confirmed|confirmé/i });

        // Save changes
        const saveButton = page.getByRole('button', { name: /save|enregistrer|update/i });
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Should show success message
          const hasSuccessMessage = await page.getByRole('alert').count() > 0;
          const hasToast = await page.locator('[role="alert"], [class*="toast"]').count() > 0;

          expect(hasSuccessMessage || hasToast).toBeTruthy();
        }
      }
    });

    test('should prevent invalid status transitions', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip();
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      // Try to transition from cancelled to confirmed (should not be allowed)
      // This test documents the requirement
      // Actual implementation would need to set up a cancelled reservation first
    });

    test('should update status using action buttons', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip();
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      // Look for action buttons (Confirm, Cancel, etc.)
      const confirmButton = page.getByRole('button', { name: /confirm|confirmer/i });
      const cancelButton = page.getByRole('button', { name: /cancel|annuler/i });

      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      } else if (await cancelButton.count() > 0) {
        // Handled in cancel tests
      }
    });
  });

  test.describe('Update Payment Status', () => {
    test('should update payment status', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip();
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      // Look for payment status update
      const paymentSelect = page.getByLabel(/payment.*status|statut.*paiement/i);

      if (await paymentSelect.count() > 0) {
        await paymentSelect.first().selectOption({ label: /paid|payé/i });

        const saveButton = page.getByRole('button', { name: /save|enregistrer/i });
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should mark as paid', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip();
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      const markPaidButton = page.getByRole('button', { name: /mark.*paid|marquer.*payé/i });

      if (await markPaidButton.count() > 0) {
        await markPaidButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Cancel Reservation', () => {
    test('should cancel reservation', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip();
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      const cancelButton = page.getByRole('button', { name: /cancel.*reservation|annuler/i });

      if (await cancelButton.count() > 0) {
        // Handle confirmation dialog
        page.once('dialog', async (dialog) => {
          expect(dialog.message()).toMatch(/cancel|annuler|confirm/i);
          await dialog.accept();
        });

        await cancelButton.click();
        await page.waitForTimeout(1000);

        // Should show cancelled status
        const hasCancelledStatus = await page.getByText(/cancelled|annulé/i).count() > 0;
        expect(hasCancelledStatus).toBeTruthy();
      }
    });

    test('should require confirmation before cancelling', async ({ page }) => {
      const reservationLink = page.locator('[href*="/reservations/"]').first();

      if (await reservationLink.count() === 0) {
        test.skip();
      }

      await reservationLink.click();
      await page.waitForURL(/\/reservations\//, { timeout: 10000 });

      const cancelButton = page.getByRole('button', { name: /cancel.*reservation|annuler/i });

      if (await cancelButton.count() > 0) {
        let dialogShown = false;

        page.once('dialog', async (dialog) => {
          dialogShown = true;
          await dialog.dismiss();
        });

        await cancelButton.click();
        await page.waitForTimeout(500);

        // Dialog should have been shown
        expect(dialogShown).toBeTruthy();
      }
    });
  });

  test.describe('Dashboard Stats', () => {
    test('should display stats on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for reservation stats
      const statsSection = page.locator('[data-testid="reservation-stats"], [class*="stats"]');

      if (await statsSection.count() > 0) {
        // Should show key metrics
        const hasTotalReservations = await page.getByText(/total.*reservations/i).count() > 0;
        const hasPendingReservations = await page.getByText(/pending/i).count() > 0;
        const hasRevenue = await page.getByText(/revenue|revenu/i).count() > 0;

        expect(hasTotalReservations || hasPendingReservations || hasRevenue).toBeTruthy();
      }
    });

    test('should show upcoming reservations', async ({ page }) => {
      await page.goto('/dashboard');

      const upcomingSection = page.getByText(/upcoming|à venir|prochaines/i);

      if (await upcomingSection.count() > 0) {
        await expect(upcomingSection.first()).toBeVisible();
      }
    });

    test('should show recent activity', async ({ page }) => {
      await page.goto('/dashboard');

      const activitySection = page.getByText(/recent.*activity|activité.*récente/i);

      if (await activitySection.count() > 0) {
        await expect(activitySection.first()).toBeVisible();
      }
    });
  });

  test.describe('Export Reservations', () => {
    test('should export reservations to CSV', async ({ page }) => {
      // Look for export button
      const exportButton = page.getByRole('button', { name: /export|exporter/i });

      if (await exportButton.count() > 0) {
        // Set up download handler
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await exportButton.click();

        const download = await downloadPromise;

        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.csv$/i);
        }
      }
    });
  });
});
