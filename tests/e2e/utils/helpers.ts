import { Page, Locator, expect } from '@playwright/test';

/**
 * Test Utility Helpers
 *
 * Common helper functions for E2E tests to reduce code duplication
 * and improve test readability.
 */

/**
 * Fill a form with data
 *
 * @param page - Playwright page object
 * @param formData - Object with label/name as key and value to fill
 *
 * @example
 * await fillForm(page, {
 *   'Email': 'test@example.com',
 *   'Password': 'secret123',
 *   'Name': 'John Doe'
 * });
 */
export async function fillForm(page: Page, formData: Record<string, string>): Promise<void> {
  for (const [label, value] of Object.entries(formData)) {
    const input = page.getByLabel(new RegExp(label, 'i'));
    await input.fill(value);
  }
}

/**
 * Wait for a toast/notification message to appear
 *
 * @param page - Playwright page object
 * @param message - Expected message text (can be partial match)
 * @param timeout - Optional timeout in milliseconds
 *
 * @example
 * await waitForToast(page, 'Successfully saved');
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const messagePattern = typeof message === 'string' ? new RegExp(message, 'i') : message;

  const toast = page.locator('[role="alert"], [data-testid="toast"], .toast, [class*="toast"]').filter({
    hasText: messagePattern,
  });

  await expect(toast).toBeVisible({ timeout });

  // Wait a bit for the toast to be readable
  await page.waitForTimeout(500);
}

/**
 * Select an option from a dropdown/select element
 *
 * @param page - Playwright page object
 * @param selector - Selector for the select element or label
 * @param value - Value or label to select
 *
 * @example
 * await selectFromDropdown(page, 'Country', 'Canada');
 */
export async function selectFromDropdown(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  let selectElement: Locator;

  // Try to find by label first
  try {
    selectElement = page.getByLabel(new RegExp(selector, 'i'));
  } catch {
    // Fallback to direct selector
    selectElement = page.locator(selector);
  }

  await selectElement.selectOption({ label: value });
}

/**
 * Upload a file to an input element
 *
 * @param page - Playwright page object
 * @param selector - Selector for the file input or label
 * @param filePath - Path to the file to upload
 *
 * @example
 * await uploadFile(page, 'Profile Photo', './test-files/avatar.jpg');
 */
export async function uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
  let fileInput: Locator;

  // Try to find by label first
  try {
    fileInput = page.getByLabel(new RegExp(selector, 'i'));
  } catch {
    // Fallback to direct selector
    fileInput = page.locator(selector);
  }

  await fileInput.setInputFiles(filePath);
}

/**
 * Upload multiple files to an input element
 *
 * @param page - Playwright page object
 * @param selector - Selector for the file input
 * @param filePaths - Array of file paths to upload
 */
export async function uploadMultipleFiles(
  page: Page,
  selector: string,
  filePaths: string[]
): Promise<void> {
  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(filePaths);
}

/**
 * Wait for a navigation to complete
 *
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to wait for
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Wait for an element to be visible
 *
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Click and wait for navigation
 *
 * @param page - Playwright page object
 * @param selector - Element to click
 * @param urlPattern - Optional URL pattern to wait for
 */
export async function clickAndNavigate(
  page: Page,
  selector: string,
  urlPattern?: string | RegExp
): Promise<void> {
  const element = page.locator(selector);
  await element.click();

  if (urlPattern) {
    await page.waitForURL(urlPattern);
  } else {
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Check if an element exists on the page
 *
 * @param page - Playwright page object
 * @param selector - Element selector
 * @returns True if element exists, false otherwise
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  const count = await element.count();
  return count > 0;
}

/**
 * Get text content of an element
 *
 * @param page - Playwright page object
 * @param selector - Element selector
 * @returns Text content of the element
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  return (await element.textContent()) || '';
}

/**
 * Wait for API response
 *
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to wait for
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<any> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );

  return response.json();
}

/**
 * Scroll to element
 *
 * @param page - Playwright page object
 * @param selector - Element selector
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * Take a screenshot with a custom name
 *
 * @param page - Playwright page object
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Wait for loading spinner to disappear
 *
 * @param page - Playwright page object
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForLoadingToFinish(page: Page, timeout: number = 10000): Promise<void> {
  const spinner = page.locator('[data-testid="loading"], [class*="spinner"], [class*="loading"]');
  const count = await spinner.count();

  if (count > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout });
  }
}

/**
 * Format date for input fields (YYYY-MM-DD)
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date N days from now
 *
 * @param days - Number of days to add
 * @returns Date object
 */
export function getDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Clear all form fields on the page
 *
 * @param page - Playwright page object
 */
export async function clearAllFormFields(page: Page): Promise<void> {
  const inputs = page.locator('input[type="text"], input[type="email"], textarea');
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    await inputs.nth(i).clear();
  }
}

/**
 * Check if checkbox is checked
 *
 * @param page - Playwright page object
 * @param selector - Checkbox selector or label
 * @returns True if checked, false otherwise
 */
export async function isCheckboxChecked(page: Page, selector: string): Promise<boolean> {
  let checkbox: Locator;

  try {
    checkbox = page.getByLabel(new RegExp(selector, 'i'));
  } catch {
    checkbox = page.locator(selector);
  }

  return await checkbox.isChecked();
}

/**
 * Accept browser dialog (alert, confirm, prompt)
 *
 * @param page - Playwright page object
 * @param action - Function that triggers the dialog
 */
export async function acceptDialog(page: Page, action: () => Promise<void>): Promise<void> {
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await action();
}

/**
 * Dismiss browser dialog (alert, confirm, prompt)
 *
 * @param page - Playwright page object
 * @param action - Function that triggers the dialog
 */
export async function dismissDialog(page: Page, action: () => Promise<void>): Promise<void> {
  page.once('dialog', async (dialog) => {
    await dialog.dismiss();
  });

  await action();
}
