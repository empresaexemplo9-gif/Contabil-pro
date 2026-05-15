# Conectando ao Neon (PostgreSQL serverless)

Guia para apontar a aplicação para um banco Neon em vez do Postgres
local. Vale para dev compartilhado entre devs e para produção.

## 1. Pegar as connection strings no painel Neon

No painel do projeto Neon, em **Connection Details**:

1. Selecione o branch (`main` para produção, ou crie um `dev` separado)
2. Selecione a role (use `neondb_owner` para dev, ou crie uma role
   `contabilpro_app` com `GRANT ALL` no schema `public`)
3. Copie:
   - **Pooled connection** (com `-pooler` no host) → será o `DATABASE_URL`
   - **Direct connection** (sem `-pooler`) → será o `DIRECT_URL`

Ambas devem ter `?sslmode=require` no final.

## 2. Configurar `.env` local

```bash
cp .env.example .env
```

Edite `.env` substituindo `DATABASE_URL` e `DIRECT_URL` pelos valores
do Neon. Exemplo:

```
DATABASE_URL="postgresql://neondb_owner:SENHA@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:SENHA@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

> **Nunca** comite `.env`. O `.gitignore` já cobre.

## 3. Aplicar o schema no Neon

```bash
pnpm db:gerar     # gera o Prisma Client local
pnpm db:migrar    # cria todas as tabelas no Neon (via DIRECT_URL)
```

Na primeira execução o Prisma pergunta um nome para a migration —
use `inicial`. Os arquivos gerados em
`packages/database/prisma/migrations/` devem ser comitados.

## 4. Habilitar Row-Level Security

```bash
pnpm db:rls
```

Aplica `packages/database/prisma/sql/habilitar-rls.sql` no Neon —
ativa as políticas multi-tenant em todas as tabelas com `escritorioId`.

## 5. Popular dados de demo (opcional)

```bash
pnpm db:semear
```

Cria 1 escritório demo + 1 usuário admin
(`admin@contabilpro.local` / senha placeholder, troque depois).

## 6. Rodar a aplicação

```bash
pnpm dev
```

- API: http://localhost:3333
- Web: http://localhost:3000
- Login: `admin@contabilpro.local`

## Diferenças do Postgres local

| | Local (docker-compose) | Neon |
|---|---|---|
| URL | `postgresql://...@localhost:5432/...` | `postgresql://...@ep-...neon.tech/...?sslmode=require` |
| Pooler | não tem (uma URL só) | obrigatório separar runtime (`-pooler`) de migrations (direto) |
| SSL | não | sim, sempre |
| BYPASSRLS p/ worker | aplique manualmente | crie role separada com BYPASSRLS |

## CI: migrations automáticas

O workflow `.github/workflows/migrate-neon.yml` aplica
`prisma migrate deploy` automaticamente em todo push para `main` que
mudar:
- `packages/database/prisma/schema.prisma`
- arquivos em `packages/database/prisma/migrations/`
- `packages/database/prisma/sql/habilitar-rls.sql`

### Configurar uma vez

No repositório GitHub: **Settings → Secrets and variables → Actions →
New repository secret**. Adicione:

| Secret | Valor |
|---|---|
| `DATABASE_URL` | Pooled connection do Neon (com `-pooler`) |
| `DIRECT_URL` | Direct connection do Neon (sem `-pooler`) |

Opcionalmente, crie um **Environment** chamado `production` (Settings →
Environments) e mova os secrets para lá — permite exigir aprovação
manual antes do deploy.

### Rodar RLS manualmente

`habilitar-rls.sql` é idempotente, mas o workflow só roda
`migrate deploy` por padrão. Para aplicar RLS:

1. **Actions → Aplicar migrations no Neon → Run workflow**
2. Marque "Reaplicar habilitar-rls.sql"

## Troubleshooting

- **`PrismaClientInitializationError: P1001`**: rede/firewall bloqueando.
  Confirme que o IP atual está liberado em **Allowed IPs** no Neon
  (ou desabilite a restrição).
- **`migration failed: error: SSL connection required`**: faltou
  `?sslmode=require` na URL.
- **Queries lentas/timeout**: verifique se está usando `-pooler` no
  `DATABASE_URL`. Sem pooler, Neon abre conexão nova a cada request.
- **`prepared statement already exists`**: o pooler do Neon não suporta
  prepared statements em transaction mode. Adicione
  `?pgbouncer=true&connection_limit=1` no `DATABASE_URL`.
