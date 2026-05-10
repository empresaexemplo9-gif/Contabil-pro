# ADR 0002 — Multi-tenancy: linha-por-tenant + Row-Level Security

- **Status:** aceito
- **Data:** 2026-05-10

## Contexto

A plataforma serve múltiplos escritórios contábeis (tenants), cada um com seus clientes (empresas) e usuários. Precisamos decidir o modelo de isolamento:

1. **Banco-por-tenant:** isolamento máximo, custo proibitivo.
2. **Schema-por-tenant:** bom isolamento, complica migrations e analytics.
3. **Linha-por-tenant com `tenantId`:** mais simples, exige cuidado para isolamento.

## Decisão

**Linha-por-tenant com `escritorioId` em todas as tabelas transacionais + Row-Level Security do PostgreSQL como rede de segurança.**

## Justificativa

- **Custo:** 1 banco serve N tenants sem multiplicação de custo de armazenamento ou réplicas.
- **Migrações instantâneas:** `prisma migrate deploy` aplica em todos os tenants simultaneamente.
- **Backup unificado:** 1 dump cobre todo o produto.
- **RLS como defense-in-depth:** mesmo que um bug na API esqueça o filtro `escritorioId`, o Postgres bloqueia.
- **Analytics interna:** time de produto pode rodar queries cross-tenant (com cuidado), o que com schema-per-tenant exigiria UNION manual.

## Implementação

1. Toda tabela transacional tem `escritorioId String`.
2. Índices compostos sempre começam com `(escritorioId, ...)`.
3. Em produção, ativar RLS:

```sql
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas FORCE ROW LEVEL SECURITY;

CREATE POLICY isolamento_tenant ON empresas
  USING (escritorio_id = current_setting('app.escritorio_id', true));
```

4. Middleware Nest seta a variável de sessão por requisição:

```ts
await prisma.$executeRaw`SET LOCAL app.escritorio_id = ${usuario.escritorioId}`;
```

5. Conexão da API usa role Postgres com `BYPASSRLS=false`.

## Consequências

- Performance: o planner usa o índice `(escritorioId, ...)` eficientemente.
- Operacional: monitorar queries que esquecem o filtro (RLS retorna 0 linhas, sintoma claro em logs).
- Migração futura para banco-por-tenant (cliente enterprise) é viável: `pg_dump` filtrado por `escritorio_id`.
