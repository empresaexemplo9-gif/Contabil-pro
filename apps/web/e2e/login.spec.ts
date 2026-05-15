import { expect, test } from '@playwright/test';

test.describe('Página de login', () => {
  test('renderiza formulário com campos e-mail/senha', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type=email]')).toBeVisible();
    await expect(page.locator('input[type=password]')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('campos email e senha são required (HTML5)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type=email]')).toHaveAttribute('required', '');
    await expect(page.locator('input[type=password]')).toHaveAttribute('required', '');
  });

  test('exibe mensagem de erro quando API rejeita credenciais', async ({ page }) => {
    // Intercepta a chamada de login e força 401 — não depende de backend real.
    await page.route('**/api/v1/auth/login', async (rota) => {
      await rota.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ mensagem: 'Credenciais inválidas' }),
      });
    });

    await page.goto('/login');
    await page.locator('input[type=email]').fill('teste@exemplo.com');
    await page.locator('input[type=password]').fill('senha-errada');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText('Credenciais inválidas')).toBeVisible();
  });
});
