# ADR 0001 — Monorepo com Turborepo + pnpm workspaces

- **Status:** aceito
- **Data:** 2026-05-10

## Contexto

ContábilPro é composto por web (Next.js), API (NestJS) e worker (BullMQ) que compartilham contratos (DTOs Zod), schema do banco (Prisma), utilitários e UI. Precisamos decidir entre:

1. Múltiplos repositórios com pacotes npm publicados.
2. Monorepo com Turborepo + pnpm.
3. Monorepo com Nx.

## Decisão

**Monorepo com Turborepo + pnpm workspaces.**

## Justificativa

- **Tipos compartilhados em tempo real** — alteração em `packages/contracts` é vista imediatamente em web e api sem publicar pacote.
- **Build cache distribuído** — Turbo evita re-buildar o que não mudou; reduz CI de minutos para segundos em PRs incrementais.
- **pnpm é leve e tem strict mode** — evita "phantom dependencies" comuns com npm/yarn.
- **Menos overhead que Nx** — não precisamos de plugins generators no início; podemos migrar para Nx se complexidade exigir.

## Consequências

- Todos os apps são versionados juntos. Não há semver entre `packages/*` (são `workspace:*`).
- Deploy de um app não dispara redeploy dos outros (graças ao filtro `pnpm prune` nos Dockerfiles).
- Onboarding de devs: 1 clone, 1 `pnpm install`.
