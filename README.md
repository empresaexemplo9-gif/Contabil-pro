# ContábilPro

Plataforma SaaS multi-tenant para gestão contábil digital. Pensada para escritórios de contabilidade e seus clientes, reúne em um único ambiente: gestão documental com assinatura eletrônica, controle de obrigações e tarefas, central de atendimento omnichannel, automações operacionais, dashboards e integrações (WhatsApp, e-mail, APIs externas).

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** NestJS 10 + TypeScript (Clean Architecture)
- **Worker:** BullMQ
- **Banco:** PostgreSQL 16 + Prisma + Row-Level Security
- **Cache/Filas:** Redis 7
- **Storage:** S3-compatível (R2/S3/MinIO)
- **Auth:** JWT RS256 + Argon2id + TOTP MFA + RBAC
- **Observabilidade:** Pino + OpenTelemetry + Sentry
- **Deploy alvo inicial:** Fly.io + Neon + Upstash + Cloudflare R2

## Estrutura

```
apps/
  web/        Portal web (Next.js) — escritório + cliente
  api/        API REST (NestJS)
  worker/     Processador de filas (BullMQ)
packages/
  database/   Schema Prisma + cliente
  contracts/  Schemas Zod compartilhados
  ui/         Design system
  auth-core/  Utilitários de autenticação
  logger/     Logger estruturado (Pino)
  utils/      Utilitários compartilhados
  config-*    Presets ESLint, TSConfig
infra/
  compose/    docker-compose para dev local
  docker/     Dockerfiles de produção
docs/         ADRs, arquitetura, segurança
```

## Pré-requisitos

- Node.js 20.10+ (`nvm use`)
- pnpm 9+
- Docker + Docker Compose

## Setup rápido

```bash
# 1. Instalar dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env

# 3. Subir infra local (Postgres, Redis, MinIO, Mailhog)
pnpm infra:subir

# 4. Migrar banco e popular dados de exemplo
pnpm db:migrar
pnpm db:semear

# 5. Rodar tudo em paralelo
pnpm dev
```

Após `pnpm dev`:
- Web: http://localhost:3000
- API: http://localhost:3333 (Swagger em `/docs`)
- MinIO Console: http://localhost:9001 (usuário/senha: `minioadmin`)
- Mailhog: http://localhost:8025
- Prisma Studio: `pnpm db:estudio`

## Scripts úteis

| Comando | O que faz |
|---|---|
| `pnpm dev` | Roda web + api + worker em paralelo |
| `pnpm build` | Build de produção de todos os apps |
| `pnpm test` | Testes unitários |
| `pnpm test:e2e` | Testes end-to-end (Playwright) |
| `pnpm lint` | Lint de tudo |
| `pnpm type-check` | Verificação de tipos |
| `pnpm db:migrar` | Aplica migrations |
| `pnpm db:estudio` | Abre Prisma Studio |
| `pnpm infra:subir` | Sobe Postgres/Redis/MinIO/Mailhog |
| `pnpm infra:descer` | Desce os serviços locais |

## Documentação

- [docs/ARQUITETURA.md](./docs/ARQUITETURA.md) — visão arquitetural completa
- [docs/SEGURANCA.md](./docs/SEGURANCA.md) — modelo de segurança e LGPD
- [docs/ADR/](./docs/ADR/) — Architecture Decision Records

## Licença

UNLICENSED — código proprietário.
