import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright para testes end-to-end do portal web.
 *
 * Padrão: testes rodam contra o build de produção em http://localhost:3000.
 * Em CI, `webServer` levanta o servidor antes dos testes. Localmente, basta
 * rodar `pnpm dev` em paralelo ou deixar o webServer iniciar.
 *
 * Os testes deste diretório cobrem apenas páginas públicas (sem auth).
 * Testes de fluxos autenticados exigem banco + API rodando e ficam em
 * `e2e/autenticado/` (a serem adicionados).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm start',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
