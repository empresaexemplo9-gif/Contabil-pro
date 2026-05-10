# Runbook Operacional — ContábilPro

## Setup local pela primeira vez

```bash
# 1. Pré-requisitos
nvm use                   # Node 20.10
corepack enable           # ativa pnpm

# 2. Dependências
pnpm install

# 3. Variáveis
cp .env.example .env
# editar .env com chaves locais

# 4. Gerar par de chaves JWT (apenas dev)
mkdir -p .keys
openssl genrsa -out .keys/jwt-private.pem 2048
openssl rsa -in .keys/jwt-private.pem -pubout -out .keys/jwt-public.pem
# colar os PEMs no .env (com \n preservado)

# 5. Subir infra local
pnpm infra:subir

# 6. Banco
pnpm db:gerar
pnpm db:migrar
pnpm db:semear

# 7. Rodar tudo
pnpm dev
```

## Comandos do dia a dia

| O que fazer | Comando |
|---|---|
| Adicionar campo no schema | edita `packages/database/prisma/schema.prisma` → `pnpm db:migrar` |
| Adicionar dependência num app | `pnpm --filter @contabilpro/api add nome-do-pacote` |
| Rodar testes de um pacote | `pnpm --filter @contabilpro/api test` |
| Limpar caches | `pnpm clean && rm -rf node_modules && pnpm install` |
| Reset banco local | `pnpm --filter @contabilpro/database prisma migrate reset` |

## Troubleshooting

### Erro de tipo no Prisma após editar schema
```bash
pnpm db:gerar
```

### Worker não está consumindo jobs
1. Verificar `REDIS_URL` no `.env` do worker.
2. `docker compose -f infra/compose/docker-compose.yml logs redis`.
3. Confirmar nome da fila no `apps/worker/src/config.ts`.

### Build do Docker falhando
- Confirmar que `pnpm-lock.yaml` está versionado.
- Limpar cache do builder: `docker builder prune`.

## Contatos

- **DPO / LGPD:** dpo@contabilpro.com.br
- **Suporte:** suporte@contabilpro.com.br
- **On-call:** ver PagerDuty / Better Stack
