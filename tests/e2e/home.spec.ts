import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Check main heading
  await expect(page.locator('h1')).toContainText('Bienvenue sur Hoostn');

  // Check tagline
  await expect(page.getByText('Gérez vos locations, pas vos complications')).toBeVisible();

  // Check CTA buttons exist
  await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Commencer gratuitement' })).toBeVisible();
});
