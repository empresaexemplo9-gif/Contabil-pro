# Diretrizes para Claude Code neste repositório

Este arquivo orienta o Claude Code (e outros agentes) sobre as convenções deste projeto. Leia antes de começar uma tarefa.

## Idioma

- **Identificadores em PT-BR sem acentos** (`Empresa`, `Usuario`, `Notificacao`, `Obrigacao`).
- **Comentários e mensagens com acentos** quando fizerem sentido em português.
- **Strings de UI sempre via i18n** (`packages/ui` ou pasta `i18n/` do app), nunca hardcoded.
- **Termos técnicos universais ficam em inglês** (`controller`, `service`, `repository`, `module`) por serem nomes de framework.

## Arquitetura

- Monorepo Turborepo. Use `pnpm --filter <pacote>` para rodar comandos isolados.
- `apps/api` segue Clean Architecture: `domain` ← `application` ← `infrastructure` ← `interfaces`.
- Tipos compartilhados FE/BE vivem em `packages/contracts` (Zod). **Nunca duplique DTOs.**
- Multi-tenant via coluna `escritorioId` + Row-Level Security do Postgres. Toda query deve respeitar tenant.

## Convenções

- TypeScript estrito (`strict: true`, `noUncheckedIndexedAccess: true`).
- Validação de entrada com Zod (mesmo schema usado no FE).
- ORM via Prisma; nunca SQL bruto exceto para RLS/policies.
- Senhas com Argon2id; tokens JWT RS256 com chave rotacionável.
- Logs estruturados via `@contabilpro/logger` (Pino). Nunca `console.log` em produção.

## Comandos comuns

```bash
pnpm dev                # tudo em paralelo
pnpm db:migrar          # gerar e aplicar migration
pnpm --filter @contabilpro/api test
pnpm --filter @contabilpro/web build
```

## Antes de comitar

1. `pnpm lint && pnpm type-check && pnpm test` — todos verdes.
2. Se mudou schema Prisma: rode `pnpm db:gerar` e comite as migrations.
3. Use Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).

## Não faça

- ❌ `console.log` no código de produção (use o logger).
- ❌ Hardcode de strings de UI (use i18n).
- ❌ Queries Prisma sem filtro de `escritorioId`.
- ❌ Commitar `.env` ou qualquer segredo.
- ❌ `--no-verify`, `--force-push` ou amend de commits já enviados.
