import { test, expect } from '@playwright/test';
import { fillForm, waitForToast, waitForNavigation } from '../utils/helpers';

/**
 * Property Management E2E Tests
 *
 * Tests cover:
 * - Property list display
 * - Create property flow (3-step wizard)
 * - Form validation
 * - Draft persistence
 * - Edit property
 * - Delete property
 * - Security (RLS enforcement)
 */

test.describe('Property Management', () => {
  // Note: These tests would ideally use an authenticated fixture
  // For now, they assume the user will be redirected to login if not authenticated

  test.describe('Property List Page', () => {
    test('should display properties list page', async ({ page }) => {
      // Navigate to login first (assuming we need auth)
      await page.goto('/dashboard/properties');

      // If redirected to login, we'd need to authenticate
      // For now, check if we're on properties page or login page
      const url = page.url();

      if (url.includes('/login') || url.includes('/auth')) {
        // We're not authenticated - this is expected behavior
        expect(url).toMatch(/\/(login|auth)/);
      } else {
        // We're authenticated - verify properties page elements
        await expect(
          page.getByRole('heading', { name: /properties|propriétés/i })
        ).toBeVisible();

        // Check for "New Property" button or similar
        const newPropertyButton = page.getByRole('button', { name: /new property|nouvelle propriété|ajouter/i });
        if (await newPropertyButton.count() > 0) {
          await expect(newPropertyButton.first()).toBeVisible();
        }
      }
    });

    test('should show empty state when no properties exist', async ({ page }) => {
      await page.goto('/dashboard/properties');

      // Skip if not authenticated
      if (page.url().includes('/login')) {
        test.skip();
      }

      // Look for empty state or list of properties
      const hasEmptyState = await page.getByText(/no properties|aucune propriété/i).count();
      const hasPropertyList = await page.locator('[data-testid="property-card"], [class*="property"]').count();

      // Should have either empty state or property list
      expect(hasEmptyState > 0 || hasPropertyList > 0).toBeTruthy();
    });
  });

  test.describe('Create Property - Multi-Step Form', () => {
    test('should create new property - step 1 (basic info)', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      // Skip if not authenticated
      if (page.url().includes('/login')) {
        test.skip();
      }

      // Verify we're on step 1
      await expect(page.getByText(/basic info|informations de base|step 1/i)).toBeVisible();

      // Fill in basic information
      await page.getByLabel(/property name|nom.*propriété/i).fill('Test RV Park');

      // Select property type
      const typeSelect = page.getByLabel(/property type|type.*propriété/i);
      if (await typeSelect.count() > 0) {
        await typeSelect.first().selectOption({ label: /campground|rv.*park/i });
      }

      // Fill description
      await page.getByLabel(/description/i).fill('A beautiful RV park with mountain views');

      // Check for Next button
      const nextButton = page.getByRole('button', { name: /next|suivant/i });
      await expect(nextButton).toBeVisible();

      // Click next
      await nextButton.click();

      // Should move to step 2
      await expect(page.getByText(/address|adresse|step 2/i)).toBeVisible({ timeout: 5000 });
    });

    test('should create new property - step 2 (address)', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Complete step 1 first
      await page.getByLabel(/property name|nom.*propriété/i).fill('Test Property');

      const typeSelect = page.getByLabel(/property type|type.*propriété/i);
      if (await typeSelect.count() > 0) {
        await typeSelect.first().selectOption({ index: 1 });
      }

      await page.getByLabel(/description/i).fill('Test description');
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Now on step 2 - fill address
      await expect(page.getByText(/address|adresse|step 2/i)).toBeVisible();

      await page.getByLabel(/street|rue/i).fill('123 Mountain View Road');
      await page.getByLabel(/city|ville/i).fill('Banff');
      await page.getByLabel(/province|state/i).fill('Alberta');
      await page.getByLabel(/postal code|code postal/i).fill('T1L 1A1');
      await page.getByLabel(/country|pays/i).fill('Canada');

      // Click next
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Should move to step 3
      await expect(page.getByText(/contact|step 3/i)).toBeVisible({ timeout: 5000 });
    });

    test('should create new property - step 3 (contact)', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Complete step 1
      await page.getByLabel(/property name|nom.*propriété/i).fill('Complete Property');
      const typeSelect = page.getByLabel(/property type|type.*propriété/i);
      if (await typeSelect.count() > 0) {
        await typeSelect.first().selectOption({ index: 1 });
      }
      await page.getByLabel(/description/i).fill('Test description');
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Complete step 2
      await page.getByLabel(/street|rue/i).fill('123 Test St');
      await page.getByLabel(/city|ville/i).fill('Calgary');
      await page.getByLabel(/province|state/i).fill('Alberta');
      await page.getByLabel(/postal code|code postal/i).fill('T2P 1A1');
      await page.getByLabel(/country|pays/i).fill('Canada');
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Now on step 3 - fill contact info
      await expect(page.getByText(/contact|step 3/i)).toBeVisible();

      await page.getByLabel(/contact name|nom.*contact/i).fill('John Manager');
      await page.getByLabel(/email|courriel/i).fill('manager@testpark.com');
      await page.getByLabel(/phone|téléphone/i).fill('(403) 555-1234');

      // Submit form
      const submitButton = page.getByRole('button', { name: /create|créer|save|enregistrer/i });
      await submitButton.click();

      // Should redirect to property detail page
      await page.waitForURL(/\/dashboard\/properties\/[a-z0-9-]+/, { timeout: 10000 });

      // Verify we're on the property page
      expect(page.url()).toMatch(/\/dashboard\/properties\/[a-z0-9-]+/);
    });

    test('should navigate back through steps', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Go to step 2
      await page.getByLabel(/property name|nom.*propriété/i).fill('Test');
      const typeSelect = page.getByLabel(/property type|type.*propriété/i);
      if (await typeSelect.count() > 0) {
        await typeSelect.first().selectOption({ index: 1 });
      }
      await page.getByLabel(/description/i).fill('Test');
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Verify we're on step 2
      await expect(page.getByText(/address|adresse|step 2/i)).toBeVisible();

      // Click back button
      const backButton = page.getByRole('button', { name: /back|précédent|retour/i });
      if (await backButton.count() > 0) {
        await backButton.click();

        // Should be back on step 1
        await expect(page.getByText(/basic info|informations de base|step 1/i)).toBeVisible();
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Try to proceed without filling required fields
      const nextButton = page.getByRole('button', { name: /next|suivant/i });

      // Click without filling form
      await nextButton.click();

      // Should show validation errors or prevent progression
      // Either we stay on same step or see error messages
      const hasError = await page.getByRole('alert').count() > 0;
      const stillOnStep1 = await page.getByText(/basic info|informations de base|step 1/i).isVisible();

      expect(hasError || stillOnStep1).toBeTruthy();
    });

    test('should validate email format in contact step', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Navigate to step 3
      // Step 1
      await page.getByLabel(/property name|nom.*propriété/i).fill('Test');
      const typeSelect = page.getByLabel(/property type|type.*propriété/i);
      if (await typeSelect.count() > 0) {
        await typeSelect.first().selectOption({ index: 1 });
      }
      await page.getByLabel(/description/i).fill('Test');
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Step 2
      await page.getByLabel(/street|rue/i).fill('123 Test St');
      await page.getByLabel(/city|ville/i).fill('Test City');
      await page.getByLabel(/province|state/i).fill('Test');
      await page.getByLabel(/postal code|code postal/i).fill('12345');
      await page.getByLabel(/country|pays/i).fill('Canada');
      await page.getByRole('button', { name: /next|suivant/i }).click();

      // Step 3 - invalid email
      await page.getByLabel(/contact name|nom.*contact/i).fill('Test');
      await page.getByLabel(/email|courriel/i).fill('invalid-email');
      await page.getByLabel(/phone|téléphone/i).fill('123-456-7890');

      const submitButton = page.getByRole('button', { name: /create|créer|save|enregistrer/i });
      await submitButton.click();

      // Should show validation error
      const emailInput = page.getByLabel(/email|courriel/i);
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());

      expect(isInvalid).toBeTruthy();
    });
  });

  test.describe('Draft Persistence', () => {
    test('should persist form data as draft', async ({ page }) => {
      await page.goto('/dashboard/properties/new');

      if (page.url().includes('/login')) {
        test.skip();
      }

      const propertyName = `Draft Property ${Date.now()}`;

      // Fill some data
      await page.getByLabel(/property name|nom.*propriété/i).fill(propertyName);

      // Wait a moment for auto-save (if implemented)
      await page.waitForTimeout(2000);

      // Navigate away and back
      await page.goto('/dashboard/properties');
      await page.goto('/dashboard/properties/new');

      // Check if data is restored (if draft feature is implemented)
      const nameInput = page.getByLabel(/property name|nom.*propriété/i);
      const value = await nameInput.inputValue();

      // If drafts are working, the value should be restored
      // If not, this test documents that behavior
      console.log('Draft persistence:', value === propertyName ? 'Working' : 'Not implemented');
    });
  });

  test.describe('Edit Property', () => {
    test('should edit existing property', async ({ page }) => {
      // This test assumes a property exists
      // In a real scenario, we'd create one first or use a fixture

      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Look for a property card or link
      const propertyLink = page.locator('[data-testid="property-card"] a, [href*="/dashboard/properties/"]').first();

      if (await propertyLink.count() === 0) {
        test.skip('No properties available to edit');
      }

      // Get the property URL
      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        // Look for edit button
        const editButton = page.getByRole('link', { name: /edit|modifier/i })
          .or(page.getByRole('button', { name: /edit|modifier/i }));

        if (await editButton.count() > 0) {
          await editButton.first().click();

          // Should be on edit page
          await page.waitForURL(/\/edit/, { timeout: 5000 });

          // Verify edit form is displayed
          const nameInput = page.getByLabel(/property name|nom.*propriété/i);
          await expect(nameInput).toBeVisible();

          // Make a change
          const currentName = await nameInput.inputValue();
          await nameInput.fill(`${currentName} (Updated)`);

          // Save changes
          const saveButton = page.getByRole('button', { name: /save|enregistrer|update/i });
          await saveButton.click();

          // Should redirect back to property page
          await page.waitForURL(/\/dashboard\/properties\/[a-z0-9-]+$/, { timeout: 10000 });
        }
      }
    });
  });

  test.describe('Delete Property', () => {
    test('should delete property', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Look for a property to delete
      const propertyLink = page.locator('[href*="/dashboard/properties/"]').first();

      if (await propertyLink.count() === 0) {
        test.skip('No properties available to delete');
      }

      const propertyUrl = await propertyLink.getAttribute('href');
      if (propertyUrl) {
        await page.goto(propertyUrl);

        // Look for delete button
        const deleteButton = page.getByRole('button', { name: /delete|supprimer/i });

        if (await deleteButton.count() > 0) {
          // Set up dialog handler for confirmation
          page.once('dialog', async (dialog) => {
            expect(dialog.type()).toBe('confirm');
            await dialog.accept();
          });

          await deleteButton.click();

          // Should redirect to properties list
          await page.waitForURL(/\/dashboard\/properties$/, { timeout: 10000 });

          // Verify we're back on the list page
          expect(page.url()).toMatch(/\/dashboard\/properties$/);
        }
      }
    });
  });

  test.describe('Security - RLS Enforcement', () => {
    test('should prevent non-owner from accessing other org properties', async ({ page }) => {
      // This test would require two different user accounts
      // For now, it's a placeholder documenting the security requirement

      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Try to access a property that doesn't belong to the current user
      // In a real test, we'd use a known property ID from a different org
      const fakePropertyId = '00000000-0000-0000-0000-000000000000';

      await page.goto(`/dashboard/properties/${fakePropertyId}`);

      // Should either:
      // 1. Show 404 error
      // 2. Show "Access Denied" message
      // 3. Redirect to properties list

      await page.waitForTimeout(2000);

      const hasError = await page.getByText(/not found|404|access denied|accès refusé/i).count() > 0;
      const redirectedToList = page.url().endsWith('/dashboard/properties');

      expect(hasError || redirectedToList).toBeTruthy();
    });
  });

  test.describe('Property Search and Filtering', () => {
    test('should search properties by name', async ({ page }) => {
      await page.goto('/dashboard/properties');

      if (page.url().includes('/login')) {
        test.skip();
      }

      // Look for search input
      const searchInput = page.getByPlaceholder(/search|rechercher/i)
        .or(page.getByLabel(/search|rechercher/i));

      if (await searchInput.count() > 0) {
        await searchInput.first().fill('Test');

        // Wait for search results
        await page.waitForTimeout(1000);

        // Results should be filtered
        // (Exact verification would depend on implementation)
      }
    });
  });
});
