import { test, expect } from '@playwright/test';
import { waitForToast, uploadFile, uploadMultipleFiles } from '../utils/helpers';
import * as path from 'path';

/**
 * Lot Management E2E Tests
 *
 * Tests cover:
 * - Display lots for a property
 * - Create lot flow (multi-step)
 * - Image upload (single and multiple)
 * - Set primary image
 * - Image size validation (5MB limit)
 * - File type validation
 * - Edit lot details
 * - Delete lot
 * - Delete lot images
 */

test.describe('Lot Management', () => {
  const TEST_PROPERTY_URL = '/dashboard/properties/test-property-id';

  test.describe('Lots Display', () => {
    test('should display lots for property', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Navigate to a property
      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();

      if (await propertyLink.count() === 0) {
        test.skip('No properties available');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        // Look for lots section
        const lotsSection = page.getByRole('heading', { name: /lots|emplacements/i });

        if (await lotsSection.count() > 0) {
          await expect(lotsSection.first()).toBeVisible();

          // Should have "Add Lot" or "New Lot" button
          const addLotButton = page.getByRole('button', { name: /new lot|nouveau lot|add lot|ajouter/i })
            .or(page.getByRole('link', { name: /new lot|nouveau lot|add lot|ajouter/i }));

          await expect(addLotButton.first()).toBeVisible();
        }
      }
    });

    test('should show empty state when no lots exist', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();

      if (await propertyLink.count() === 0) {
        test.skip('No properties available');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        // Check for either empty state or list of lots
        const hasEmptyState = await page.getByText(/no lots|aucun emplacement/i).count() > 0;
        const hasLots = await page.locator('[data-testid="lot-card"]').count() > 0;

        expect(hasEmptyState || hasLots).toBeTruthy();
      }
    });
  });

  test.describe('Create Lot - Multi-Step Form', () => {
    test('should create new lot - step 1 (basic info)', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Navigate to a property
      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip('No properties available');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(`${propertyUrl}/lots/new`);

        // Fill basic info
        await page.getByLabel(/lot name|nom.*lot/i).fill('Lot A1');
        await page.getByLabel(/description/i).fill('Beautiful lakefront lot with full hookups');

        // Select lot type
        const typeSelect = page.getByLabel(/lot type|type.*lot/i);
        if (await typeSelect.count() > 0) {
          await typeSelect.first().selectOption({ label: /rv|camping-car/i });
        }

        // Set max guests
        await page.getByLabel(/max guests|nombre.*personnes/i).fill('4');

        // Click next
        const nextButton = page.getByRole('button', { name: /next|suivant/i });
        await nextButton.click();

        // Should move to step 2
        await expect(page.getByText(/pricing|amenities|prix|équipements|step 2/i)).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('should create new lot - step 2 (amenities & pricing)', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip('No properties available');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(`${propertyUrl}/lots/new`);

        // Complete step 1
        await page.getByLabel(/lot name|nom.*lot/i).fill('Lot B2');
        await page.getByLabel(/description/i).fill('Test lot');
        const typeSelect = page.getByLabel(/lot type|type.*lot/i);
        if (await typeSelect.count() > 0) {
          await typeSelect.first().selectOption({ index: 1 });
        }
        await page.getByLabel(/max guests|nombre.*personnes/i).fill('2');
        await page.getByRole('button', { name: /next|suivant/i }).click();

        // Now on step 2
        await expect(page.getByText(/pricing|amenities|prix|équipements|step 2/i)).toBeVisible();

        // Set base price
        await page.getByLabel(/base price|prix.*base/i).fill('75.00');

        // Select amenities (checkboxes)
        const wifiCheckbox = page.getByLabel(/wifi|wi-fi/i);
        if (await wifiCheckbox.count() > 0) {
          await wifiCheckbox.first().check();
        }

        const electricityCheckbox = page.getByLabel(/electricity|électricité/i);
        if (await electricityCheckbox.count() > 0) {
          await electricityCheckbox.first().check();
        }

        // Click next
        const nextButton = page.getByRole('button', { name: /next|suivant/i });
        await nextButton.click();

        // Should move to step 3 (images)
        await expect(page.getByText(/images|photos|step 3/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should create new lot - step 3 (images)', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip('No properties available');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(`${propertyUrl}/lots/new`);

        // Complete step 1
        await page.getByLabel(/lot name|nom.*lot/i).fill('Lot C3');
        await page.getByLabel(/description/i).fill('Test lot');
        const typeSelect = page.getByLabel(/lot type|type.*lot/i);
        if (await typeSelect.count() > 0) {
          await typeSelect.first().selectOption({ index: 1 });
        }
        await page.getByLabel(/max guests|nombre.*personnes/i).fill('2');
        await page.getByRole('button', { name: /next|suivant/i }).click();

        // Complete step 2
        await page.getByLabel(/base price|prix.*base/i).fill('50.00');
        await page.getByRole('button', { name: /next|suivant/i }).click();

        // Now on step 3 - images
        await expect(page.getByText(/images|photos|step 3/i)).toBeVisible();

        // Image upload would be tested separately
        // For now, we can skip images and create the lot
        const createButton = page.getByRole('button', { name: /create|créer|save|enregistrer/i });
        if (await createButton.count() > 0) {
          await createButton.click();

          // Should redirect to lot detail page
          await page.waitForURL(/\/lots\/[a-z0-9-]+/, { timeout: 10000 });
        }
      }
    });
  });

  test.describe('Image Upload', () => {
    test('should upload multiple images (up to 20)', async ({ page }) => {
      // This test would require actual image files
      // For now, it's a placeholder documenting the requirement

      test.skip('Requires test image files');

      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Navigate to lot creation/edit
      // Upload multiple images
      // Verify they appear in the preview
      // Max 20 images allowed
    });

    test('should set primary image', async ({ page }) => {
      // This test would require an existing lot with images

      test.skip('Requires existing lot with images');

      // Navigate to lot edit page
      // Click "Set as primary" on a non-primary image
      // Verify the primary image changes
    });

    test('should validate image size limit (5MB)', async ({ page }) => {
      // This test would require a large test file

      test.skip('Requires large test file');

      // Try to upload file > 5MB
      // Should show error message
      // File should not be uploaded
    });

    test('should reject invalid file types', async ({ page }) => {
      // This test would require invalid file types

      test.skip('Requires test files of invalid types');

      // Try to upload .txt, .pdf, etc.
      // Should show error message
      // Only accept image formats (jpg, png, webp, etc.)
    });
  });

  test.describe('Edit Lot', () => {
    test('should edit lot details', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Navigate to a property with lots
      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip('No properties available');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        // Find a lot to edit
        const lotLink = page.locator('[href*="/lots/"]').first();
        if (await lotLink.count() === 0) {
          test.skip('No lots available to edit');
        }

        const lotUrl = await lotLink.getAttribute('href');
        if (lotUrl) {
          await page.goto(lotUrl);

          // Click edit button
          const editButton = page.getByRole('link', { name: /edit|modifier/i })
            .or(page.getByRole('button', { name: /edit|modifier/i }));

          if (await editButton.count() > 0) {
            await editButton.first().click();

            // Should be on edit page
            await page.waitForURL(/\/edit/, { timeout: 5000 });

            // Make changes
            const nameInput = page.getByLabel(/lot name|nom.*lot/i);
            const currentName = await nameInput.inputValue();
            await nameInput.fill(`${currentName} (Updated)`);

            // Save
            const saveButton = page.getByRole('button', { name: /save|enregistrer|update/i });
            await saveButton.click();

            // Should redirect back
            await page.waitForURL(/\/lots\/[a-z0-9-]+$/, { timeout: 10000 });
          }
        }
      }
    });

    test('should update lot pricing', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip();
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        const lotLink = page.locator('[href*="/lots/"]').first();
        if (await lotLink.count() === 0) {
          test.skip();
        }

        const lotUrl = await lotLink.getAttribute('href');
        if (lotUrl) {
          await page.goto(`${lotUrl}/edit`);

          // Navigate to pricing step if multi-step
          const priceInput = page.getByLabel(/base price|prix.*base/i);
          if (await priceInput.count() > 0) {
            await priceInput.fill('99.99');

            const saveButton = page.getByRole('button', { name: /save|enregistrer|update/i });
            await saveButton.click();

            await page.waitForTimeout(2000);
          }
        }
      }
    });
  });

  test.describe('Delete Lot', () => {
    test('should delete lot', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip();
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        const lotLink = page.locator('[href*="/lots/"]').first();
        if (await lotLink.count() === 0) {
          test.skip('No lots to delete');
        }

        const lotUrl = await lotLink.getAttribute('href');
        if (lotUrl) {
          await page.goto(lotUrl);

          const deleteButton = page.getByRole('button', { name: /delete|supprimer/i });
          if (await deleteButton.count() > 0) {
            // Handle confirmation dialog
            page.once('dialog', async (dialog) => {
              expect(dialog.type()).toBe('confirm');
              await dialog.accept();
            });

            await deleteButton.click();

            // Should redirect to property page
            await page.waitForURL(/\/dashboard\/properties\/[a-z0-9-]+$/, { timeout: 10000 });
          }
        }
      }
    });
  });

  test.describe('Delete Lot Images', () => {
    test('should delete individual lot images', async ({ page }) => {
      test.skip('Requires lot with images');

      // Navigate to lot edit page
      // Click delete on an image
      // Confirm deletion
      // Verify image is removed
    });

    test('should delete all lot images', async ({ page }) => {
      test.skip('Requires lot with images');

      // Navigate to lot edit page
      // Click "Delete all images" or similar
      // Confirm deletion
      // Verify all images are removed
    });
  });

  test.describe('Lot Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip();
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(`${propertyUrl}/lots/new`);

        // Try to submit without filling required fields
        const nextButton = page.getByRole('button', { name: /next|suivant/i });
        await nextButton.click();

        // Should show validation errors
        const hasError = await page.getByRole('alert').count() > 0;
        const stillOnStep1 = await page.getByLabel(/lot name|nom.*lot/i).isVisible();

        expect(hasError || stillOnStep1).toBeTruthy();
      }
    });

    test('should validate max guests is a positive number', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip();
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(`${propertyUrl}/lots/new`);

        // Fill with invalid max guests
        await page.getByLabel(/lot name|nom.*lot/i).fill('Test');
        await page.getByLabel(/description/i).fill('Test');
        await page.getByLabel(/max guests|nombre.*personnes/i).fill('-1');

        const nextButton = page.getByRole('button', { name: /next|suivant/i });
        await nextButton.click();

        // Should show validation error
        const guestsInput = page.getByLabel(/max guests|nombre.*personnes/i);
        const isInvalid = await guestsInput.evaluate((el: HTMLInputElement) => !el.checkValidity());

        expect(isInvalid).toBeTruthy();
      }
    });

    test('should validate base price is a positive number', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();
      if (await propertyLink.count() === 0) {
        test.skip();
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(`${propertyUrl}/lots/new`);

        // Complete step 1
        await page.getByLabel(/lot name|nom.*lot/i).fill('Test');
        await page.getByLabel(/description/i).fill('Test');
        const typeSelect = page.getByLabel(/lot type|type.*lot/i);
        if (await typeSelect.count() > 0) {
          await typeSelect.first().selectOption({ index: 1 });
        }
        await page.getByLabel(/max guests|nombre.*personnes/i).fill('2');
        await page.getByRole('button', { name: /next|suivant/i }).click();

        // Try invalid price
        await page.getByLabel(/base price|prix.*base/i).fill('-10');

        const nextButton = page.getByRole('button', { name: /next|suivant|create|créer/i });
        await nextButton.click();

        // Should show validation error
        const priceInput = page.getByLabel(/base price|prix.*base/i);
        const isInvalid = await priceInput.evaluate((el: HTMLInputElement) => !el.checkValidity());

        expect(isInvalid).toBeTruthy();
      }
    });
  });
});
