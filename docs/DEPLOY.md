# Deploy — ContábilPro

Stack alvo escolhido em `ARQUITETURA.md` §8:

| Camada | Provedor | URL final (sugestão) |
|---|---|---|
| Web (Next.js) | **Fly.io** | `https://contabilpro.fly.dev` |
| API (NestJS) | **Fly.io** | `https://contabilpro-api.fly.dev` |
| Worker (BullMQ) | **Fly.io** | (sem URL pública) |
| Postgres | **Neon** | `*.neon.tech` |
| Redis | **Upstash** | `*.upstash.io` |
| Storage | **Cloudflare R2** | `*.r2.cloudflarestorage.com` |
| E-mail | **Resend** | API |

> **Custo aproximado em 2026:** Fly cobra ~US$ 1.94/mês por máquina shared-cpu-1x rodando 24/7. Com `auto_stop=stop` (já configurado), as máquinas só ligam sob tráfego — fica praticamente em US$ 0 enquanto o produto está vazio. Neon, Upstash, R2 e Resend seguem com free tier permanente nos volumes do MVP.

---

## 1. Pré-requisitos (uma vez só)

### 1.1 Ferramentas locais

```bash
# Fly CLI
curl -L https://fly.io/install.sh | sh
fly auth signup   # ou fly auth login

# Node + pnpm (caso vá rodar migrações localmente)
node --version    # 20.10+
corepack enable && corepack prepare pnpm@9.12.0 --activate
```

### 1.2 Provedores externos

**Neon (Postgres)** — https://console.neon.tech
1. Criar projeto `contabilpro`, região `aws-us-east-1` (mais barata) ou `aws-sa-east-1`.
2. Copiar **Connection string (pooled)** — você vai usar essa.
3. Habilitar a extensão `citext`, `pg_trgm`, `pgcrypto` na aba "SQL Editor":
   ```sql
   CREATE EXTENSION IF NOT EXISTS citext;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

**Upstash (Redis)** — https://console.upstash.com
1. Criar database `contabilpro`, região mais próxima de `gru`.
2. Copiar **Redis URL** (formato `rediss://default:...@...upstash.io:6379`).

**Cloudflare R2** — https://dash.cloudflare.com → R2
1. Criar bucket `contabilpro`.
2. Em "Manage R2 API Tokens" criar token com permissão `Object Read & Write` para o bucket.
3. Copiar `Account ID`, `Access Key ID`, `Secret Access Key`. O endpoint é `https://<account_id>.r2.cloudflarestorage.com`.

**Resend (e-mail)** — https://resend.com
1. Verificar domínio (ou usar `onboarding@resend.dev` em dev).
2. Criar API key.

**Google OAuth** (opcional) — https://console.cloud.google.com/apis/credentials
1. Criar **OAuth client** tipo Web.
2. Authorized JavaScript origins: `https://contabilpro.fly.dev`.
3. Authorized redirect URIs: `https://contabilpro-api.fly.dev/api/v1/auth/google/callback`.

### 1.3 Chaves JWT (RS256)

```bash
openssl genrsa -out chave-privada.pem 2048
openssl rsa -in chave-privada.pem -pubout -out chave-publica.pem
# Para passar pro Fly:
cat chave-privada.pem | base64 -w 0    # ou usar fly secrets set diretamente com aspas
```

---

## 2. Primeiro deploy

### 2.1 Criar as três apps no Fly

```bash
fly apps create contabilpro --org pessoal           # web
fly apps create contabilpro-api --org pessoal       # API
fly apps create contabilpro-worker --org pessoal    # worker
```

### 2.2 Configurar `fly secrets` da API

```bash
fly secrets set --app contabilpro-api \
  DATABASE_URL="postgres://...@...neon.tech/contabilpro?sslmode=require" \
  REDIS_URL="rediss://default:...@...upstash.io:6379" \
  API_URL="https://contabilpro-api.fly.dev" \
  WEB_URL="https://contabilpro.fly.dev" \
  CORS_ORIGINS="https://contabilpro.fly.dev" \
  JWT_PRIVATE_KEY="$(cat chave-privada.pem)" \
  JWT_PUBLIC_KEY="$(cat chave-publica.pem)" \
  S3_ENDPOINT="https://<account>.r2.cloudflarestorage.com" \
  S3_BUCKET="contabilpro" \
  S3_ACCESS_KEY="..." \
  S3_SECRET_KEY="..." \
  RESEND_API_KEY="re_..." \
  EMAIL_REMETENTE_PADRAO="no-reply@seudominio.com.br" \
  GOOGLE_CLIENT_ID="...apps.googleusercontent.com" \
  GOOGLE_CLIENT_SECRET="GOCSPX-..." \
  GOOGLE_REDIRECT_URI="https://contabilpro-api.fly.dev/api/v1/auth/google/callback"
```

### 2.3 Configurar `fly secrets` do Worker

Mesmas variáveis sensíveis do API (sem `JWT_PUBLIC_KEY`, sem `GOOGLE_*`, sem `API_URL/WEB_URL/CORS_ORIGINS`):

```bash
fly secrets set --app contabilpro-worker \
  DATABASE_URL="..." \
  REDIS_URL="..." \
  S3_ENDPOINT="..." S3_BUCKET="..." S3_ACCESS_KEY="..." S3_SECRET_KEY="..." \
  RESEND_API_KEY="..." \
  EMAIL_REMETENTE_PADRAO="..." \
  WHATSAPP_TOKEN="..." \
  ZAPSIGN_API_TOKEN="..."
```

### 2.4 Aplicar migrations e seed

```bash
# Apontar para a Neon e aplicar:
DATABASE_URL="postgres://...neon.tech/..." \
  pnpm --filter @contabilpro/database exec prisma migrate deploy

# Semear (cria escritório demo + ADMIN inicial):
DATABASE_URL="postgres://...neon.tech/..." \
  pnpm --filter @contabilpro/database db:semear

# Ativar RLS (recomendado em produção):
DATABASE_URL="postgres://...neon.tech/..." \
  pnpm --filter @contabilpro/database db:rls
```

### 2.5 Deploy inicial

```bash
fly deploy --config infra/fly/api.fly.toml --dockerfile infra/docker/api.Dockerfile --remote-only
fly deploy --config infra/fly/worker.fly.toml --dockerfile infra/docker/worker.Dockerfile --remote-only
fly deploy --config infra/fly/web.fly.toml --dockerfile infra/docker/web.Dockerfile --remote-only
```

Abrir:
- Painel do escritório: https://contabilpro.fly.dev/login
- Portal do cliente: https://contabilpro.fly.dev/portal-cliente/login

---

## 3. Deploy contínuo via GitHub Actions

O workflow `.github/workflows/deploy.yml` faz deploy automático a cada push em `main`. Para habilitar:

1. Gerar token de deploy no Fly:
   ```bash
   fly tokens create deploy -x 8760h
   ```
2. No GitHub → Settings → Secrets and variables → Actions, adicionar:
   - `FLY_API_TOKEN` = output do comando acima
   - `NEON_DATABASE_URL` = mesma connection string da Neon (usada na job `migrar`)
3. Push em `main` dispara: `migrar` → `api` + `worker` (paralelo) → `web`.

Para deploy manual de uma app específica: Actions → Deploy (Fly.io) → Run workflow → escolher `alvo`.

---

## 4. Domínio customizado

```bash
# Web (frontend) em domínio próprio
fly certs create app.contabilpro.com.br --app contabilpro
# Apontar no DNS: CNAME app.contabilpro.com.br → contabilpro.fly.dev

# API em subdomínio
fly certs create api.contabilpro.com.br --app contabilpro-api
# CNAME api.contabilpro.com.br → contabilpro-api.fly.dev
```

Depois do DNS propagar, atualizar:
- `API_URL`, `WEB_URL`, `CORS_ORIGINS` na app API
- `NEXT_PUBLIC_API_URL` na app web
- Authorized origins/redirects no Google OAuth

---

## 5. Operação

```bash
# Logs ao vivo
fly logs --app contabilpro-api
fly logs --app contabilpro-worker
fly logs --app contabilpro-web

# Status
fly status --app contabilpro-api

# Escalar manualmente
fly scale count 2 --app contabilpro-api      # rodar 2 réplicas
fly scale memory 1024 --app contabilpro-api  # subir RAM para 1GB

# Console SSH (debug)
fly ssh console --app contabilpro-api
```

### Healthcheck

`GET /saude` (API) já está mapeado e é usado pelo Fly. Retorna `{"status":"ok"}` quando o Postgres está acessível.

### Rollback

```bash
fly releases --app contabilpro-api
fly releases rollback <versao> --app contabilpro-api
```

---

## 6. Custos esperados

| Item | Free tier | Quando cobra |
|---|---|---|
| Fly machines | — | ~US$ 1.94/máquina/mês (shared-cpu-1x, 256MB). Com `auto_stop` cai a fração. |
| Fly IPv4 público | 1 grátis por org | US$ 2/mês a partir do 2º |
| Neon | 0.5 GB DB, 100h compute/mês | US$ 19/mês plano Launch quando passar |
| Upstash | 10 k cmds/dia, 256 MB | US$ 0.20 por 100 k cmds |
| R2 | 10 GB + 1M class-A + 10M class-B/mês | US$ 0.015/GB de storage |
| Resend | 3 000 e-mails/mês, 100/dia | US$ 20/mês a partir |

**Estimativa MVP rodando vazio:** ~US$ 0–3/mês.
**Estimativa 5–10 escritórios reais:** ~US$ 15–25/mês.
