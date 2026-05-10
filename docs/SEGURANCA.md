# Segurança e Conformidade — ContábilPro

## 1. Princípios

- **Defesa em profundidade** — nenhuma camada é a única linha de defesa.
- **Menor privilégio** — papéis e permissões granulares; tokens com escopo mínimo.
- **Falha segura** — em caso de erro, negar; nunca expor stack trace ao cliente.
- **Auditoria total** — toda ação sensível registrada em log imutável.

## 2. Autenticação e sessão

- **Senhas:** Argon2id (memória 19 MiB, 2 iterações). Política mínima: 10 caracteres, classes mistas.
- **JWT:** RS256 com par de chaves rotacionável. TTL do access token: 15min. Refresh token: 30 dias com rotação a cada uso e detecção de reuso (revoga toda a cadeia).
- **MFA:** TOTP RFC 6238 obrigatório para papéis `PROPRIETARIO` e `ADMIN`. Códigos de backup gerados na ativação.
- **Sessões persistidas** com IP/UA — administrador pode revogar individualmente.
- **Rate limit:** 5 tentativas de login/15min por IP+email.

## 3. Autorização

- **RBAC:** papéis fixos (`PROPRIETARIO`, `ADMIN`, `CONTADOR`, `ASSISTENTE`, `CLIENTE`).
- **ABAC:** lista de permissões granulares por vínculo (`empresas:escrever`, etc).
- **Multi-tenant:** todo recurso é filtrado por `escritorioId` extraído do JWT. Em produção, RLS do Postgres reforça via `current_setting('app.escritorio_id')`.

## 4. Proteções de aplicação (OWASP Top 10)

| Risco | Mitigação |
|---|---|
| A01 Broken Access Control | RBAC + ABAC + RLS Postgres |
| A02 Cryptographic Failures | TLS obrigatório; Argon2id; segredos criptografados em repouso |
| A03 Injection | ORM Prisma (zero SQL bruto exceto RLS); Zod em toda entrada |
| A04 Insecure Design | Threat modeling em ADRs; revisão de design |
| A05 Security Misconfiguration | Helmet, CORS estrito, CSP, headers de segurança |
| A06 Vulnerable Components | Dependabot, `pnpm audit` no CI |
| A07 Auth Failures | MFA, rate-limit, lockout, refresh com reuse-detection |
| A08 Data Integrity | Hash SHA-256 de documentos; assinaturas digitais |
| A09 Logging Failures | Pino estruturado + Sentry; logs imutáveis em audit log |
| A10 SSRF | Allowlist de URLs em integrações; sem URLs vindas do usuário |

## 5. Tratamento de dados

### 5.1 Em trânsito
- TLS 1.2+ em toda borda (Cloudflare).
- HSTS habilitado.

### 5.2 Em repouso
- Disco do Postgres criptografado (AES-256 do provedor).
- Credenciais de integrações: criptografadas via `pgcrypto` ou KMS.
- Storage S3: server-side encryption.

### 5.3 Logs
- Pino com redaction automática de: `senha`, `senhaHash`, `token*`, `credenciais`, `mfaSegredo`, `Authorization`, `Cookie`.

## 6. Upload de arquivos

- Tamanho máximo: 500 MiB.
- MIME validado por **magic bytes** no worker, não pelo header HTTP.
- Antivírus: ClamAV no worker antes de marcar como `ATIVO`.
- Bucket privado; acesso apenas via URLs presignadas com TTL curto (10min).
- Hash SHA-256 calculado pelo cliente e revalidado no servidor.

## 7. LGPD

| Direito | Implementação |
|---|---|
| Art. 18.II Acesso | endpoint `/usuarios/eu/exportar` (futuro) |
| Art. 18.IV Anonimização | soft-delete + job de purga após retenção |
| Art. 18.VI Eliminação | exclusão real após período legal de obrigações fiscais |
| Art. 37 Registro de operações | tabela `logs_auditoria` imutável |
| Art. 41 Encarregado (DPO) | contato no `docs/RUNBOOK.md` |

## 8. Segredos

- Nunca em `.env` versionado.
- Em desenvolvimento: `.env` local (gitignored).
- Em produção: Doppler / SOPS / AWS Secrets Manager.
- Rotação trimestral das chaves JWT e tokens de integração.

## 9. Resposta a incidentes

1. Detecção via Sentry (alerta) ou monitoring.
2. Triagem em até 1h em horário comercial.
3. Comunicação ao DPO em < 24h se houver dado pessoal envolvido.
4. Notificação à ANPD em < 72h conforme Art. 48 da LGPD.
5. Post-mortem em `docs/incidentes/AAAA-MM-DD-titulo.md`.

## 10. Checklist pré-produção

- [ ] HTTPS forçado e HSTS preload.
- [ ] CSP estrita configurada e testada.
- [ ] Backup automático do Postgres (retenção 30 dias).
- [ ] Disaster recovery testado (restore em staging trimestral).
- [ ] Pen-test externo antes do GA.
- [ ] Rotação de chaves JWT funcionando.
- [ ] RLS ativo em todas as tabelas com `escritorioId`.
- [ ] Audit log com retenção mínima de 5 anos.
