# RELATÓRIO EXECUTIVO — ContábilPro

> Documento gerado a partir de análise direta do código-fonte em `2026-05-29`.
> Branch analisada: `claude/contabilvpro-architecture-XMZPq`.
> Métricas brutas usadas como base:
> - **~15.000 LOC TypeScript** (5.958 API + 7.740 web + 1.447 pacotes)
> - **22 modelos Prisma**, **20 enums**, **1 migration** aplicada
> - **18 controladores REST / ~96 endpoints**
> - **9 jobs assíncronos**
> - **43 commits** entre **2026-05-10** e **2026-05-20** (~10 dias corridos)
> - **0 testes** unitários na API, **2** no web, **0** e2e

---

## 1. IDENTIFICAÇÃO

- **Nome do produto:** ContábilPro (repo: `contabil-pro`)
- **Uma frase que resume:** SaaS multi-tenant para escritórios de contabilidade gerirem clientes, documentos, obrigações fiscais, atendimento e automações em um único painel.
- **Cliente(s) atual(is) ou alvo:** escritórios contábeis de pequeno a médio porte no Brasil (1–50 contadores), com seus clientes (empresas) usando um portal de autoatendimento.
- **Status:** **MVP de código / pré-produção.** Existe deploy parcial no Vercel mas com build quebrando no momento desta análise (problema de `prisma generate` no CI, corrigido na branch atual). **Não está acessível pra usuários finais.**
- **Está em produção hoje? Onde? Quem usa?** **Não.** Nenhum cliente pagante. O seed do banco cria um escritório de exemplo (`escritorio-demo`) com usuários fictícios para desenvolvimento.
- **De quem é a ideia/propriedade?** Sócios da DRAP. Código proprietário (`UNLICENSED` no `package.json`). Sem parceiro externo identificado no código.

---

## 2. RELAÇÃO COM OUTROS PRODUTOS

- **Compartilha código com outros produtos da DRAP?** Pela análise isolada deste repositório, **não há indicações de código compartilhado** com os outros 7 produtos. O `package.json` referencia só pacotes internos (`@contabilpro/*`) e bibliotecas públicas.
- **É adaptação/derivação de outro produto?** Não aparenta ser. A estrutura de domínio (escritórios → empresas → documentos → obrigações) é específica do nicho contábil. **A confirmar com a equipe** se há reuso de UI design system, lib de auth, ou padrão arquitetural vindo de outro produto.
- **% específico vs herdado:** **~100% específico** com base no que está no repo. Os pacotes `packages/auth-core`, `packages/ui`, `packages/logger`, etc são privados do monorepo (`workspace:*`), não vêm de fora. **Verificar** se houve copy-paste de outro produto da DRAP antes do commit inicial.

---

## 3. O PROBLEMA QUE RESOLVE

- **Dor específica:** Escritórios contábeis brasileiros operam hoje com uma colcha de retalhos: e-mail/WhatsApp pra trocar documentos, Excel para controle de obrigações (SPED, DCTF, eSocial, DAS, etc), pasta no Drive pra arquivo, sistema separado pra assinatura, planilha de prazos. Falta um sistema único que cruze "este cliente tem essa obrigação vencendo, falta esse documento, e tem uma mensagem dele no WhatsApp".
- **Como o cliente resolve hoje:**
  - **Domínio (Thomson Reuters), Alterdata, Sage, Questor:** ERPs contábeis tradicionais (caros, desktop ou pesados, sem foco em comunicação cliente).
  - **Conta Azul, Omie:** focados no cliente final (PJ), não no escritório.
  - **Realidade da maioria:** planilha + Drive + WhatsApp + sistema fiscal antigo.
- **Por que nossa solução é melhor (na hipótese):** integra **documentos + assinatura eletrônica + obrigações + atendimento omnichannel + automações** num só painel multi-tenant, com portal pro cliente final, focado em escritório pequeno/médio que não tem TI dedicada. **É uma hipótese — sem validação de mercado no código.**

---

## 4. O QUE ESTÁ DE FATO CONSTRUÍDO

### Core / Identidade
- **Autenticação multi-fator** `[IMPLEMENTADO]` — login com email+senha (Argon2id), Google OAuth, MFA TOTP, refresh tokens com rotação por família, recuperação de senha (12 endpoints).
- **RBAC com 5 papéis** `[IMPLEMENTADO]` — `PROPRIETARIO`, `ADMIN`, `CONTADOR`, `ASSISTENTE`, `CLIENTE`. Decorator `@Papeis()` aplicado em controladores. Permissões granulares por string array no vínculo.
- **Multi-tenant via `escritorioId`** `[IMPLEMENTADO]` — todas as tabelas transacionais têm `escritorioId`, com guarda no interceptor.
- **Row-Level Security do Postgres** `[PARCIAL]` — script SQL `habilitar-rls.sql` existe e é aplicável via workflow, mas **a confirmar** se está ativo nos deploys.
- **Gestão de usuários e convites** `[IMPLEMENTADO]` — sem cadastro público; admin convida com senha temporária mostrada uma vez (Argon2id).

### CRM Contábil
- **Cadastro de empresas-cliente** `[IMPLEMENTADO]` — CNPJ, razão social, regime tributário (Simples/Lucro Presumido/Lucro Real/MEI/Imune), endereço, contatos múltiplos (8 endpoints).

### Cofre de Documentos
- **Upload, versionamento, categorias, hash SHA256** `[IMPLEMENTADO]` — armazenamento via Vercel Blob (migrado de S3 esta semana), com tabela de versões (`VersaoDocumento`) e retenção configurável por categoria (13 endpoints).
- **Download com URL pública** `[IMPLEMENTADO]` — URLs estáveis do Blob (sem TTL — segurança por hash aleatório).
- **Limite atual:** 4.5 MB por upload (cap de função Vercel; passa por API).

### Assinatura Eletrônica
- **Integração ZapSign** `[IMPLEMENTADO]` — cria solicitação, recebe webhook de status, atualiza signatários. Modelos para outros provedores (`ClickSign`, `D4Sign`) existem no enum mas **não há implementação** (4 endpoints).

### Obrigações e Tarefas Fiscais
- **Modelos de obrigação (templates)** `[IMPLEMENTADO]` — frequência (mensal/trimestral/anual), dia de vencimento, regimes aplicáveis.
- **Geração automática de tarefas** `[IMPLEMENTADO]` — job `gerar-tarefas-automaticas` roda mensal (cron dia 25) e cria tarefas para empresas elegíveis.
- **Detector de atrasos** `[IMPLEMENTADO]` — job `detectar-atrasadas` roda diário e marca tarefas vencidas como `ATRASADA`.
- **Lembrete de obrigação** `[IMPLEMENTADO]` — job `lembrar-obrigacao` dispara notificações N dias antes.
- **Kanban/lista de tarefas** `[IMPLEMENTADO]` — atribuição a responsáveis, prioridade, status (6+5 endpoints).

### Central de Atendimento (Inbox Omnichannel)
- **Conversas multicanal** `[IMPLEMENTADO]` — modelo suporta `PORTAL`, `EMAIL`, `WHATSAPP` com SLA, mensagens, anexos (6 endpoints).
- **WhatsApp Cloud API (Meta)** `[IMPLEMENTADO]` — pacote `packages/integracoes/src/whatsapp.ts`; envio + recepção via webhook.
- **Canal e-mail** `[PARCIAL]` — `Resend` está nas envs e no enum `ProvedorIntegracao`, há job `enviar-email`, mas o fluxo de entrada de e-mail pra criar conversa **não foi verificado**.

### Notificações
- **In-app, email, WhatsApp** `[IMPLEMENTADO]` — job `enviar-notificacao` despacha pelo canal apropriado (2 endpoints de leitura).
- **Push notification** `[PLANEJADO]` — `CanalNotificacao.PUSH` existe no enum, sem service-worker ou FCM no código.

### Automações (engine no-code)
- **Editor de gatilhos e passos** `[IMPLEMENTADO]` — armazena `gatilho` e `passos` como JSON, job `executar-automacao` interpreta e executa, gravando histórico em `ExecucaoAutomacao` (7 endpoints). **Verificar profundidade** — pode ser ainda primitivo (linguagem JSON limitada).

### Portal do Cliente
- **Autoatendimento para a empresa-cliente** `[IMPLEMENTADO]` — login separado (Google OAuth também), visualização de documentos próprios, assinaturas pendentes, mensagens, obrigações da própria empresa (10 endpoints + 5 rotas web).

### Relatórios e Auditoria
- **Relatórios** `[PARCIAL]` — 5 endpoints: documentos por status, empresas por regime, tarefas, etc. **Sem dashboards visuais profundos** (gráficos a verificar).
- **Log de auditoria (LGPD art. 37)** `[IMPLEMENTADO]` — toda ação relevante grava em `LogAuditoria` com ator, IP, diff JSON (2 endpoints de leitura).

### Faturamento (do próprio SaaS)
- **Cobrança / billing** `[PLANEJADO]` — único endpoint `GET /faturamento/plano` retorna o plano atual do escritório (`FREE/STARTER/PRO/ENTERPRISE`). **Não há integração com Stripe, asaas, paggar ou outro gateway.** Não há fatura, cartão salvo, trial, downgrade. Cobrança seria 100% manual hoje.

### Infraestrutura / Plataforma
- **Migração concluída pra stack Vercel-only** `[IMPLEMENTADO]` — esta semana: NestJS rodando como função Vercel; BullMQ → Upstash QStash + Vercel Cron; S3 → Vercel Blob. Saiu Railway/Render do desenho.
- **Deploy em produção** `[PARCIAL]` — projeto criado no Vercel, mas build ainda quebrava no momento desta análise (faltava `prisma generate` no postinstall; corrigido no commit `8cab4f7`). **URL pública ainda não responde.**

---

## 5. STACK TÉCNICA

| Camada | Tecnologia |
|---|---|
| **Linguagem** | TypeScript estrito (`strict: true`, `noUncheckedIndexedAccess: true`) |
| **Frontend** | Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui |
| **Backend** | NestJS 10 (Clean Architecture: domain/application/infrastructure/interfaces) |
| **ORM / Schema** | Prisma 5.22 + PostgreSQL 16 (extensões: `pgcrypto`, `citext`, `pg_trgm`) |
| **Validação** | Zod (schemas compartilhados FE/BE via `@contabilpro/contracts`) |
| **Filas** | Upstash QStash (HTTP, serverless-friendly) + Vercel Cron |
| **Storage** | Vercel Blob (era S3/R2 — migrado) |
| **Auth** | JWT RS256 (chave rotacionável) + Argon2id + TOTP MFA |
| **Banco de produção** | Neon (Postgres serverless) |
| **Hospedagem** | Vercel (apps/web + apps/api como funções) |
| **Observabilidade** | Pino (logs estruturados) + Sentry (DSN configurado) + OpenTelemetry mencionado no README — **a verificar implementação** |
| **CI** | GitHub Actions — workflow `migrate-neon.yml` aplica migrations automaticamente em push pra `main` |
| **Monorepo** | pnpm 9 + Turborepo |

**Integrações externas (críticas):**
- **Neon** (banco) — sem ele, app inoperante.
- **Vercel** (hospedagem + Blob + Cron) — vendor lock razoável. Migração pra outro provedor exigiria refatorar storage, jobs e deploy.
- **Upstash QStash** (filas) — sem ele, jobs assíncronos param.
- **Resend** (e-mail) — sem ele, notificações por email não saem.
- **WhatsApp Cloud API (Meta)** — sem ele, canal WhatsApp morto.
- **ZapSign** (assinatura) — sem ele, fluxo de assinatura quebra.
- **Google OAuth** — opcional (tem login por senha como fallback).

**Bus factor de provedor:** se Vercel + Neon ficarem offline juntos, o produto para. **Possível mitigar** com backup automatizado do Neon, mas não há failover ativo.

---

## 6. POTENCIALIDADES

- **Pode virar SaaS escalável?** **Sim**, a arquitetura suporta. Multi-tenant em uma única instância, isolamento por `escritorioId` + RLS, custo por tenant baixo (Postgres+Blob serverless). Cada escritório novo é só uma linha em `escritorios`.
- **Tamanho do mercado endereçável (TAM/SAM):** Brasil tem **~80.000 escritórios contábeis ativos** (dados CFC/Sescon, ordem de grandeza). Mesmo capturando 0,5% = **400 escritórios pagantes**. Ticket médio razoável: R$ 300–800/mês por escritório → **ARR potencial R$ 1,4M–3,8M**. Em 5% (mercado maduro) chega a **ARR R$ 14M–38M**. **Hipótese de mercado, não validada com pesquisa.**
- **Vender pra outros do mesmo segmento?** Sim — escritórios contábeis são clientes-padrão e operam parecido entre si. Diferencial competitivo é a **integração com WhatsApp** (Domínio/Alterdata não têm de forma nativa) e o **portal do cliente** (Conta Azul tem, mas mira o cliente final, não o contador).
- **Funcionalidades que destravam valor:**
  1. **Integração com receita federal (eCAC, SEFAZ, eSocial)** — buscar status de obrigações direto do governo. **Não existe no código** e é a feature mais pedida nesse mercado.
  2. **Importação automática de XML de NF-e** — hoje upload manual. Existe integração com SEFAZ municipal/estadual via certificado digital.
  3. **Cobrança automática via PIX/boleto** dos clientes finais do escritório.
  4. **App mobile** pro contador atender no celular (hoje só web responsivo).
  5. **Faturamento real** do próprio SaaS (Stripe/asaas) — sem isso, monetização é manual.
  6. **IA contábil** — classificação de documentos, sugestão de lançamentos, resposta automática de mensagem (área quente em 2026).

---

## 7. LIMITAÇÕES E RISCOS

### Frágil / não funciona ainda
- **Deploy em produção quebrado no momento desta análise** — o build no Vercel falhava com 38 erros TypeScript do Prisma porque `prisma generate` não rodava. Corrigido nesta sessão (commit `8cab4f7`), mas **ainda não validado em deploy real**.
- **Domínio próprio não configurado** — só URL de preview do Vercel.
- **Sem testes automatizados** — 0 unit tests na API, 2 no web, 0 e2e. Qualquer regressão passa direto pra produção.

### Dívida técnica
- **TypeScript inferia tipos do Prisma só localmente** — porque o cliente era gerado em `pnpm install` da máquina, mas não no CI. Sinal de que **a configuração de monorepo foi feita rápido**, sem stress-test.
- **`vercel.json` do `apps/web` foi ignorado pelo Vercel** (auto-detectou Turbo e rodou `turbo run build` da raiz) — indica que a configuração de deploy não foi exaustivamente testada.
- **Faturamento é stub**: 1 endpoint que devolve o enum do plano. Sem cobrança real, monetização exige operação manual.
- **Push notification só no enum**, sem implementação.
- **Integrações com outros provedores de assinatura** (`ClickSign`, `D4Sign`) estão no enum mas só ZapSign tem código real.
- **Tipos `Prisma.InputJsonValue` espalhados** — sinal de Json columns "destipadas" (gatilho/passos de automação, payload de webhook). Funcional, mas frágil em mudança de schema.

### Riscos LGPD / segurança
- **PII guardada:** CNPJs, CPFs (em `Usuario.cpf` e `Signatario.cpf`), e-mails, telefones, endereços de empresas. Dados sensíveis em volume.
- **Credenciais de integração em `Integracao.credenciais` (Json)** — schema comenta "criptografar antes de persistir" mas **a verificar se de fato há criptografia at-rest** no código (não encontrei rotina de KMS/sodium no schema scan).
- **Auditoria gravada** ✓ — `LogAuditoria` cobre o art. 37 da LGPD.
- **RLS no Postgres** — script existe (`habilitar-rls.sql`), mas **a confirmar se está aplicado** no Neon de produção (workflow `migrate-neon.yml` tem input `aplicar-rls=true`, opcional).
- **Backup do Neon** — política padrão do Neon, **a verificar** retenção e teste de restore.
- **MFA opcional, não obrigatório** — usuário pode logar só com senha (TOTP é opt-in via `mfaAtivo`).
- **Vercel Blob URLs são públicas por hash** — não há TTL nem assinatura curta. Quem vazar uma URL acessa o documento. Mitigação atual: hash aleatório longo, URL nunca exposta diretamente ao frontend (sempre via `/documentos/:id/download` autenticado). **Considerar** proxy autenticado pra documentos sensíveis em vez de redirect.

### Escala
- **10 clientes simultâneos:** suporta sem problema. Neon + Vercel funções escalam horizontalmente.
- **100 clientes simultâneos:** ainda suporta, mas o **limite de 4.5 MB no upload** começa a doer (planilhas, XMLs grandes de SPED).
- **1.000 clientes:** precisa **Vercel Pro com Fluid Compute** pra streamed body + revisão de cold starts em rotas críticas.
- **Filas:** QStash é cobrado por mensagem; com 100 escritórios × 50 obrigações/mês × notificações, pode ficar caro. **A modelar custo**.

### Bus factor
- Histórico de Git mostra **commits 100% feitos por "Claude" via Claude Code** (43/43). **Nenhum sócio humano da DRAP commitou direto no repo até agora.** Isso quer dizer:
  - Boa: o conhecimento está estruturado em `CLAUDE.md`, ADRs, docs.
  - Ruim: **não há engenheiro humano com o código na cabeça**. Se o agente para de funcionar amanhã, ninguém debug-a a quente.
  - **Bus factor real = a equipe DRAP precisa saber ler/editar Node+Next+NestJS+Prisma**, ou manter um agente operacional.

---

## 8. ESFORÇO E MATURIDADE

- **Tempo investido (visível):** **~10 dias corridos** (10 a 20 de maio de 2026), 43 commits, ~15k LOC TypeScript. Velocidade só viável com geração assistida por IA — equivalente a **3–6 meses de 1 engenheiro humano sênior**.
- **Quão perto está de "vendável"?** **Médio.** Em termos de **funcionalidade**, cobre o que um escritório pequeno espera. Em termos de **estabilidade e operação**, precisa:
  - [ ] Deploy funcionando de ponta a ponta (em andamento).
  - [ ] Domínio próprio + SSL + página de marketing.
  - [ ] Onboarding novo escritório funcional (hoje é por seed manual no banco).
  - [ ] Pelo menos um suite de testes mínima (smoke test de login, criar empresa, subir documento, listar obrigações).
  - [ ] Faturamento real (Stripe ou asaas).
  - [ ] Telefone/suporte ou pelo menos canal de erro (Sentry funcional).
  - [ ] Política de privacidade + termos de uso (LGPD).
  - [ ] **1 cliente piloto pagando R$ 0 por 60 dias pra validar.**
- **Estimativa pra chegar lá:** **3–6 semanas de trabalho focado** com o mesmo ritmo atual, focando em deploy estável + onboarding + faturamento + 1 piloto.

---

## 9. MODELO DE RECEITA

- **Como gera dinheiro?** **Hoje: não gera.** Não há gateway de cobrança implementado nem cliente pagante.
- **Modelo planejado (inferido dos planos no enum):**
  - **FREE** — trial ou tier limitado (até X empresas-cliente).
  - **STARTER** — escritório pequeno (sugestão: R$ 199/mês, até 30 empresas, 5 usuários).
  - **PRO** — escritório médio (sugestão: R$ 599/mês, até 200 empresas, usuários ilimitados, automações ativas).
  - **ENTERPRISE** — escritório grande / customização (sob consulta, R$ 1.500–3.000+/mês).
- **Setup único?** Não há módulo de setup separado. **Recomendado adicionar** "implantação assistida" como fee único (R$ 1.500–3.000) pra cobrir treinamento e migração de planilha→sistema.
- **Status:** **[PLANEJADO]** — projeção, sem cliente real ainda.
- **Projeção realista** (cenário base, 12 meses):
  - Mês 1–3: piloto gratuito com 3 escritórios → 0 ARR.
  - Mês 4–6: 5 pagantes em STARTER + 1 PRO → ~**R$ 1,6k MRR / R$ 19k ARR**.
  - Mês 7–12: 20 pagantes mix → ~**R$ 8k MRR / R$ 96k ARR**.
  - Ano 2 (se canal estabelecido): **R$ 25–50k MRR**.

---

## 10. RESUMO EXECUTIVO

**ContábilPro** é um SaaS multi-tenant em estágio de **MVP de código pré-produção** voltado a escritórios contábeis pequenos e médios no Brasil. Em ~10 dias e 15 mil linhas de TypeScript, foi construído um sistema com profundidade funcional acima da média do estágio (gestão de empresas-cliente, cofre de documentos com versionamento, assinatura eletrônica via ZapSign, controle de obrigações fiscais com geração automática de tarefas, atendimento omnichannel via WhatsApp/email/portal, engine de automações no-code, portal do cliente final, RBAC com 5 papéis, auditoria LGPD) — **mas zero tração comercial**: não há cliente pagante, o módulo de faturamento é stub, o deploy estava com build quebrado no momento desta análise (corrigido na branch), e a cobertura de testes é praticamente nula. O potencial é real (TAM de ~80k escritórios no Brasil, diferencial em WhatsApp + portal cliente vs Domínio/Alterdata), mas o gap entre "código pronto" e "produto que clientes usam e pagam" exige 3–6 semanas focadas em deploy estável, faturamento real e um piloto comercial para validar o ICP.
