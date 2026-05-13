# Arquitetura — ContábilPro

## 1. Visão geral

ContábilPro é uma plataforma SaaS multi-tenant para gestão contábil digital. Une, em um único produto, gestão documental com assinatura eletrônica, controle de obrigações fiscais, central de atendimento omnichannel, automações operacionais, dashboards e integrações (WhatsApp, e-mail, APIs externas).

Inspirações: Whatslog, Acessórias, Onvio.

## 2. Diagrama de alto nível

```
                         ┌─────────────────────┐
                         │   Cloudflare CDN    │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
          ┌───────▼─────┐   ┌───────▼─────┐   ┌──────▼──────┐
          │  Next.js    │   │  Next.js    │   │  Webhook    │
          │  (escritório)│   │  (cliente) │   │  externos   │
          └───────┬─────┘   └───────┬─────┘   └──────┬──────┘
                  │                 │                 │
                  └────────┬────────┴────────┬────────┘
                           │                 │
                    ┌──────▼─────┐    ┌──────▼──────┐
                    │  NestJS    │    │  Socket.IO  │
                    │  REST API  │    │  (gateway)  │
                    └─────┬──────┘    └──────┬──────┘
                          │                  │
            ┌─────────────┼──────────────────┼──────────────┐
            │             │                  │              │
       ┌────▼────┐   ┌────▼─────┐      ┌─────▼─────┐   ┌────▼────┐
       │ Postgres│   │  Redis   │      │  S3 / R2  │   │ BullMQ  │
       │  (RLS)  │   │  (cache) │      │  (storage)│   │ Worker  │
       └─────────┘   └──────────┘      └───────────┘   └────┬────┘
                                                            │
                                       ┌────────────────────┼────────────────────┐
                                       │                    │                    │
                                  ┌────▼─────┐         ┌────▼────┐         ┌────▼────┐
                                  │  Resend  │         │WhatsApp │         │ ZapSign │
                                  │  (email) │         │  Cloud  │         │(assinat)│
                                  └──────────┘         └─────────┘         └─────────┘
```

## 3. Decisões arquiteturais principais

### 3.1 Monorepo com Turborepo + pnpm

- Build cache distribuído, paralelismo entre apps.
- Tipos TypeScript compartilhados sem publicação npm.
- `packages/contracts` (Zod) é a única fonte de verdade para DTOs FE/BE.

### 3.2 Multi-tenancy: row-level com `escritorioId` + RLS Postgres

**Alternativas consideradas:** schema-per-tenant, banco-per-tenant.

**Escolhido:** linha-por-tenant porque:
- Custo operacional muito menor (1 banco vs N).
- Migrações instantâneas para todos os clientes.
- RLS do Postgres oferece isolamento forte equivalente.
- Permite analytics cross-tenant (com cuidado) para o time interno.

Toda tabela transacional tem coluna `escritorioId`. Em produção, ativar políticas RLS:

```sql
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON empresas
  USING (escritorio_id = current_setting('app.escritorio_id')::text);
```

A API seta `app.escritorio_id` via `SET LOCAL` no início de cada transação a partir do JWT.

### 3.3 Clean Architecture na API

```
domain/         entidades, value objects, regras puras
application/    casos de uso (orquestração)
infrastructure/ Prisma, S3, HTTP clients, fila
interfaces/     controllers Nest, DTOs
```

Cada módulo (em `apps/api/src/modulos/`) é um bounded context auto-contido, com entrada explícita pelo controlador e saída pelos repositórios.

### 3.4 Autenticação

- **JWT RS256** (par de chaves rotacionável; suporta múltiplos issuers no futuro)
- **Argon2id** para senhas (parâmetros conforme OWASP 2024)
- **TOTP MFA** opcional, obrigatório para papéis administrativos
- **Refresh tokens** com rotação + reuse-detection (revoga toda a cadeia se reuso)
- **Sessões persistidas** em `sessoes` (revogáveis)

### 3.5 Filas com BullMQ

Todo trabalho assíncrono passa por filas Redis. Filas atuais:
- `email`, `whatsapp` — envio
- `notificacoes` — fan-out in-app + canais
- `documentos` — antivírus, OCR, indexação
- `automacoes` — engine no-code
- `obrigacoes` — agendador diário (cron) que enfileira lembretes

Vantagens: retry exponencial, isolamento de falhas, escala horizontal independente da API.

### 3.6 Storage

S3-compatível com **presigned URLs** — o cliente faz upload direto, sem passar pela API. Hash SHA-256 calculado pelo cliente e validado no servidor depois.

### 3.7 Realtime

`Socket.IO` no NestJS para o módulo de atendimento (chat ao vivo, presença) e push de notificações.

## 4. Módulos / bounded contexts

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, MFA, refresh, recuperação de senha |
| `escritorios` | Tenant (escritório contábil) e configurações |
| `usuarios` + `rbac` | Cadastro, papéis e permissões |
| `empresas` | CRM contábil (clientes do escritório) |
| `documentos` | Upload, versionamento, busca, retenção |
| `assinaturas` | Fluxo de assinatura eletrônica + adapter de provedor |
| `obrigacoes` + `tarefas` | Templates de obrigações e tarefas atribuídas |
| `atendimento` | Inbox omnichannel (Portal, e-mail, WhatsApp) |
| `notificacoes` | Fan-out in-app + e-mail + WhatsApp |
| `automacoes` | Engine no-code (gatilho → condição → ação) |
| `relatorios` | Dashboards e indicadores |
| `integracoes` | Adapters para serviços externos + webhooks |
| `auditoria` | Log imutável (LGPD art. 37) |
| `faturamento` | Plano e billing do escritório |

## 5. Fluxos críticos

### 5.1 Upload de documento

1. Cliente solicita `POST /documentos/presignar-upload`.
2. API gera URL presignada para o S3 e devolve a chave.
3. Cliente sobe o arquivo direto ao S3 (PUT).
4. Cliente confirma com `POST /documentos` (com hash SHA-256, tamanho, mime).
5. API persiste e enfileira jobs (antivírus + OCR + indexação).
6. Worker processa e atualiza `metadados`.

### 5.2 Solicitação de assinatura

1. `POST /assinaturas` com `documentoId` e signatários.
2. API persiste e chama provedor (ZapSign/Clicksign/D4Sign) via adapter.
3. Provedor envia e-mails/SMS aos signatários.
4. Cada assinatura gera webhook → `POST /webhooks/assinatura`.
5. API atualiza status; ao concluir, dispara notificação aos envolvidos.

### 5.3 Lembrete de obrigação

1. Agendador (cron diário) enfileira job em `obrigacoes`.
2. Worker varre tarefas com vencimento ≤ 3 dias.
3. Para cada tarefa, enfileira notificação multi-canal.

## 6. Stack — versões

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 20.10 LTS |
| Pacotes | pnpm | 9.12 |
| Build orchestrator | Turborepo | 2.1 |
| Frontend | Next.js | 15 |
| Frontend | React | 19 |
| Backend | NestJS | 10 |
| ORM | Prisma | 5.22 |
| Banco | PostgreSQL | 16 |
| Cache/filas | Redis | 7 |
| Filas SDK | BullMQ | 5 |
| Validação | Zod | 3.23 |
| Tipos compart. | TypeScript | 5.6 |

## 7. Observabilidade

- Logs JSON estruturados via Pino com redaction de campos sensíveis.
- Tracing distribuído via OpenTelemetry (config futuro).
- Erros enviados ao Sentry (config via `SENTRY_DSN`).
- Healthcheck em `GET /saude` testando conexão com Postgres.

## 8. Deploy alvo inicial

- **Web:** Fly.io (Docker standalone do Next.js)
- **API:** Fly.io (Docker)
- **Worker:** Fly.io (Docker)
- **Banco:** Neon (Postgres serverless)
- **Cache/filas:** Upstash (Redis serverless)
- **Storage:** Cloudflare R2

Trocável para AWS (ECS+RDS+ElastiCache+S3) ou Vercel+Railway sem refactor — apenas pipeline.

## 9. Próximos passos

- [x] Implementar refresh token rotation com reuse-detection.
- [x] Ativar RLS no Postgres em produção.
- [x] Adapter ZapSign + webhooks.
- [x] Integração WhatsApp Cloud API (envio + recebimento).
- [x] Engine de automações (motor passo-a-passo).
- [x] Dashboard com gráficos (recharts).
- [x] Página de Relatórios com filtros e exportação CSV.
- [x] Console de Configurações (escritório, equipe, integrações, auditoria).
- [x] Portal do Cliente (documentos, obrigações, assinaturas, mensagens).
- [ ] OCR de documentos (AWS Textract ou Tesseract).
- [ ] Testes E2E Playwright dos fluxos críticos.
- [ ] Tracing OpenTelemetry → Sentry.
