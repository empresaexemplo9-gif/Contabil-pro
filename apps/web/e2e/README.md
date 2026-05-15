# Testes E2E (Playwright)

Testes end-to-end do portal `@contabilpro/web`.

## Como rodar

```bash
# 1. Instale os browsers (uma vez)
pnpm --filter @contabilpro/web exec playwright install --with-deps

# 2. Em outra aba, suba o web em modo produção
pnpm --filter @contabilpro/web build
pnpm --filter @contabilpro/web start

# 3. Rode os testes
pnpm --filter @contabilpro/web test:e2e

# Ou com UI mode (debug interativo):
pnpm --filter @contabilpro/web test:e2e:ui
```

Em CI o `webServer` da `playwright.config.ts` levanta o `pnpm start` automaticamente.

## O que está coberto

Apenas **páginas públicas** (não exigem auth nem backend rodando):

- `home.spec.ts` — landing renderiza heading + CTAs, navegação para /login e /portal-cliente/login
- `login.spec.ts` — formulário renderiza, valida HTML5, exibe erro com API mockada via `page.route`

## O que falta

Fluxos autenticados (empresa → documento → assinatura) precisam de:

- API + Postgres + Redis em pé (`pnpm infra:subir`)
- Seed determinístico (`pnpm db:semear`)
- Helper de login que salva o token no `localStorage` antes de cada teste

Esses ficam em `e2e/autenticado/` quando o ambiente CI estiver pronto.
