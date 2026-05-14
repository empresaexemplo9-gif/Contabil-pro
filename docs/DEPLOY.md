# Deploy — ContábilPro

> **Tem duas trilhas neste guia:**
> - **Trilha A — Sem cartão** (Render + Vercel + Neon + Upstash). Custo R$ 0; cold start de ~30s. Veja a seção [Trilha sem cartão](#trilha-sem-cartão-render--vercel-windows-powershell).
> - **Trilha B — Stack original** (Fly.io para tudo). Exige cartão; ~US$ 0–3/mês. Continua disponível abaixo.

## Stack original (Fly.io) — `ARQUITETURA.md` §8

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

---

# Trilha sem cartão (Render + Vercel, Windows PowerShell)

Para quem **não quer cadastrar cartão de crédito agora**. Custo: R$ 0. Limitação principal: a API dorme após 15 min ociosa (cold start de ~30s no primeiro acesso depois de dormir).

| Camada | Provedor | URL final |
|---|---|---|
| Web (Next.js) | **Vercel** Hobby | `https://contabilpro.vercel.app` |
| API (NestJS) | **Render** Free | `https://contabilpro-api.onrender.com` |
| Worker (BullMQ) | **Render** Free Worker | sem URL pública |
| Postgres | **Neon** Free | sem cartão |
| Redis | **Upstash** Free | sem cartão |
| E-mail | **Resend** Free | sem cartão (3 k/mês) |
| Storage | _(adiado)_ | habilitar depois |

## 1. Criar contas (15 min, só navegador)

Abra os links abaixo, crie cada conta usando o **mesmo e-mail** quando possível (mais fácil depois):

| Passo | Link | O que copiar |
|---|---|---|
| 1.1 | https://github.com/signup | (já deve ter — usado para login no Render/Vercel) |
| 1.2 | https://console.neon.tech | "Connection string (pooled)" — começa com `postgres://` |
| 1.3 | https://console.upstash.com | "Redis URL" — começa com `rediss://` |
| 1.4 | https://resend.com | API key — começa com `re_` |
| 1.5 | https://dashboard.render.com → New → Blueprint | _não copia nada agora, só cria conta_ |
| 1.6 | https://vercel.com/signup | _idem_ |

No **Neon**, depois de criar o projeto, abra "SQL Editor" e cole:

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Salve as 4 strings copiadas (Neon, Upstash, Resend, mais a Vercel URL que virá depois) num bloco de notas.

## 2. Preparar ambiente Windows (10 min)

Abra **PowerShell** (Iniciar → digite "powershell"):

```powershell
# Instalar git, Node 20 e pnpm
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
# Após instalar, FECHE e reabra o PowerShell
node --version    # esperado: v20.x
npm install -g pnpm@9.12.0
pnpm --version    # esperado: 9.12.0

# Clonar o projeto
cd $HOME
git clone https://github.com/empresaexemplo9-gif/Contabil-pro.git
cd Contabil-pro
git checkout claude/continue-contabilpro-uL3Li
pnpm install
```

## 3. Gerar chaves JWT (1 min)

Windows não tem `openssl` por padrão. Use o que vem com o git que você instalou:

```powershell
& "C:\Program Files\Git\usr\bin\openssl.exe" genrsa -out chave-privada.pem 2048
& "C:\Program Files\Git\usr\bin\openssl.exe" rsa -in chave-privada.pem -pubout -out chave-publica.pem
Get-Content chave-privada.pem | Set-Clipboard   # já copia para a área de transferência
```

Cole **temporariamente** num bloco de notas e marque como "JWT_PRIVATE_KEY". Repita para a pública:

```powershell
Get-Content chave-publica.pem | Set-Clipboard
```

## 4. Aplicar migrations + seed no Neon (3 min)

```powershell
# Substitua pela connection string da Neon que você copiou:
$env:DATABASE_URL="postgres://USER:PASS@HOST/DB?sslmode=require"
pnpm --filter @contabilpro/database exec prisma migrate deploy
pnpm --filter @contabilpro/database db:semear
```

Pronto — seu usuário `thiagohccarvalho00@gmail.com` já está cadastrado como ADMIN no banco.

## 5. Deploy da API + Worker no Render (5 min)

1. Faça push do seu fork pro **seu** GitHub (se ainda não fez):
   ```powershell
   # No GitHub crie um repositório vazio chamado "contabilpro"
   # Depois, no PowerShell:
   git remote set-url origin https://github.com/SEU_USUARIO/contabilpro.git
   git push -u origin claude/continue-contabilpro-uL3Li:main
   ```

2. No Render: **Dashboard → New + → Blueprint** → conectar GitHub → selecionar o repo `contabilpro` → branch `main`. O Render lê o `render.yaml` e mostra os 2 serviços: `contabilpro-api` e `contabilpro-worker`.

3. Em **Environment Variables**, o Render pede pra preencher as marcadas como `sync: false`. Cole:
   - `DATABASE_URL` = string da Neon
   - `REDIS_URL` = string da Upstash
   - `JWT_PRIVATE_KEY` = conteúdo do `chave-privada.pem` (incluindo `-----BEGIN/END-----`)
   - `JWT_PUBLIC_KEY` = conteúdo do `chave-publica.pem`
   - `RESEND_API_KEY` = `re_...`
   - `EMAIL_REMETENTE_PADRAO` = `onboarding@resend.dev` (até verificar domínio)
   - `WEB_URL` e `CORS_ORIGINS` = **deixar em branco por enquanto** (vamos preencher após criar o Vercel)
   - As demais (S3_*, GOOGLE_*, WHATSAPP_*, ZAPSIGN_*) = deixar em branco

4. Clicar **Apply**. Render constrói e sobe. ~6 min na primeira vez.

5. Quando ficar verde, copie a URL gerada: `https://contabilpro-api.onrender.com` (será essa exatamente se o nome estiver disponível).

## 6. Deploy do Web no Vercel (3 min)

1. https://vercel.com/new → importar `SEU_USUARIO/contabilpro`.
2. Em **Root Directory** selecionar `apps/web`.
3. Em **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://contabilpro-api.onrender.com`
   - `NEXT_PUBLIC_AMBIENTE` = `production`
4. **Deploy**.

A URL final será `https://<seu-projeto>.vercel.app`.

## 7. Conectar Vercel ↔ Render (2 min)

Voltar no Render → `contabilpro-api` → **Environment**:
- `WEB_URL` = `https://<seu-projeto>.vercel.app`
- `CORS_ORIGINS` = mesma URL

Render reinicia automaticamente. Após ~1 min, abra:

**`https://<seu-projeto>.vercel.app/login`**

Faça login com `thiagohccarvalho00@gmail.com` / `147532159St@`. Troque a senha em "Configurações → Equipe" (ou via "Esqueci minha senha").

## 8. Ativar uploads de documentos (opcional, mais tarde)

Quando quiser habilitar upload de documentos:

- **Cloudflare R2** (10 GB free, mais barato no overage) — exige cartão
- **Backblaze B2** (10 GB free) — exige cartão na maioria dos casos
- **Supabase Storage** (1 GB free, sem cartão) — alternativa enquanto não tiver cartão

Adicione as 4 variáveis (`S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`) no Render. A API reinicia sozinha e os uploads passam a funcionar.

## 9. Limitações do plano free Render

- **Cold start**: serviço dorme após 15 min sem requisições. Primeira chamada depois disso espera ~30 s. Para evitar, use um pinger gratuito (ex.: cron-job.org chamando `/saude` a cada 10 min).
- **750 h/mês por serviço grátis**: API + Worker rodando 24/7 = 720 h cada → cabe.
- **CPU/RAM**: 0.1 vCPU / 512 MB. Suficiente para até dezenas de usuários simultâneos.
- **Banda**: 100 GB/mês de saída — bastante para MVP.
