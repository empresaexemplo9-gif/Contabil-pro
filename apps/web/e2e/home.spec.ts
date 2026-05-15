import { expect, test } from '@playwright/test';

test.describe('Página inicial', () => {
  test('renderiza heading do produto e CTAs principais', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Contábil');
    await expect(page.getByRole('link', { name: 'Acesso do escritório' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Portal do cliente' })).toBeVisible();
  });

  test('CTA "Acesso do escritório" navega para /login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Acesso do escritório' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CTA "Portal do cliente" navega para /portal-cliente/login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Portal do cliente' }).click();
    await expect(page).toHaveURL(/\/portal-cliente\/login$/);
  });
});
