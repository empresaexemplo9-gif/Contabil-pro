-- ============================================================================
-- ContabilPro — Habilita Row-Level Security (RLS) multi-tenant
-- ----------------------------------------------------------------------------
-- Aplicar APÓS as migrations do Prisma terem criado as tabelas.
--
-- Estratégia:
--   1. Toda tabela transacional liga RLS + FORCE RLS (até superuser respeita).
--   2. Política `isolamento_tenant` filtra por current_setting('app.escritorio_id').
--      Sem o GUC definido, current_setting(..., true) retorna NULL, e a
--      comparação `escritorio_id = NULL` produz NULL (negativa). Resultado:
--      zero linhas para conexões que não setarem o GUC.
--   3. A API (NestJS) abre uma transação por request e executa
--      `SET LOCAL app.escritorio_id = '<id>'` antes de qualquer query.
--   4. Tabelas filhas (que não têm escritorio_id direto) usam EXISTS para
--      derivar o tenant via parent.
--
-- Como aplicar:
--   psql "$DATABASE_URL" -f packages/database/prisma/sql/habilitar-rls.sql
-- ou:
--   pnpm db:rls
-- ============================================================================

-- Helper: lê o GUC como text; retorna NULL se não estiver setado.
CREATE OR REPLACE FUNCTION app_escritorio_atual() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.escritorio_id', true), '');
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- Tabelas com escritorio_id direto
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'empresas',
    'categorias_documento',
    'documentos',
    'solicitacoes_assinatura',
    'modelos_obrigacao',
    'tarefas',
    'conversas',
    'notificacoes',
    'automacoes',
    'integracoes',
    'logs_auditoria',
    'vinculos_usuario'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tabela);
    EXECUTE format(
      'DROP POLICY IF EXISTS isolamento_tenant ON %I',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY isolamento_tenant ON %I USING (escritorio_id = app_escritorio_atual()) WITH CHECK (escritorio_id = app_escritorio_atual())',
      tabela
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- eventos_webhook: escritorio_id é nullable (recebido antes de resolver tenant)
-- Política mais permissiva para leitura: visíveis quando match OU órfãos
-- (escritorio_id IS NULL). Escritas sempre exigem match.
-- ----------------------------------------------------------------------------
ALTER TABLE eventos_webhook ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_webhook FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolamento_tenant ON eventos_webhook;
CREATE POLICY isolamento_tenant ON eventos_webhook
  USING (escritorio_id IS NULL OR escritorio_id = app_escritorio_atual())
  WITH CHECK (escritorio_id IS NULL OR escritorio_id = app_escritorio_atual());

-- ----------------------------------------------------------------------------
-- Tabelas filhas (sem escritorio_id direto) — derivam via parent
-- ----------------------------------------------------------------------------

-- contatos_empresa → empresas.escritorio_id
ALTER TABLE contatos_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_empresa FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolamento_tenant ON contatos_empresa;
CREATE POLICY isolamento_tenant ON contatos_empresa
  USING (
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = contatos_empresa.empresa_id
        AND e.escritorio_id = app_escritorio_atual()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = contatos_empresa.empresa_id
        AND e.escritorio_id = app_escritorio_atual()
    )
  );

-- versoes_documento → documentos.escritorio_id
ALTER TABLE versoes_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE versoes_documento FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolamento_tenant ON versoes_documento;
CREATE POLICY isolamento_tenant ON versoes_documento
  USING (
    EXISTS (
      SELECT 1 FROM documentos d
      WHERE d.id = versoes_documento.documento_id
        AND d.escritorio_id = app_escritorio_atual()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documentos d
      WHERE d.id = versoes_documento.documento_id
        AND d.escritorio_id = app_escritorio_atual()
    )
  );

-- signatarios → solicitacoes_assinatura.escritorio_id
ALTER TABLE signatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatarios FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolamento_tenant ON signatarios;
CREATE POLICY isolamento_tenant ON signatarios
  USING (
    EXISTS (
      SELECT 1 FROM solicitacoes_assinatura s
      WHERE s.id = signatarios.solicitacao_id
        AND s.escritorio_id = app_escritorio_atual()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM solicitacoes_assinatura s
      WHERE s.id = signatarios.solicitacao_id
        AND s.escritorio_id = app_escritorio_atual()
    )
  );

-- mensagens → conversas.escritorio_id
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolamento_tenant ON mensagens;
CREATE POLICY isolamento_tenant ON mensagens
  USING (
    EXISTS (
      SELECT 1 FROM conversas c
      WHERE c.id = mensagens.conversa_id
        AND c.escritorio_id = app_escritorio_atual()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversas c
      WHERE c.id = mensagens.conversa_id
        AND c.escritorio_id = app_escritorio_atual()
    )
  );

-- execucoes_automacao → automacoes.escritorio_id
ALTER TABLE execucoes_automacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE execucoes_automacao FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS isolamento_tenant ON execucoes_automacao;
CREATE POLICY isolamento_tenant ON execucoes_automacao
  USING (
    EXISTS (
      SELECT 1 FROM automacoes a
      WHERE a.id = execucoes_automacao.automacao_id
        AND a.escritorio_id = app_escritorio_atual()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM automacoes a
      WHERE a.id = execucoes_automacao.automacao_id
        AND a.escritorio_id = app_escritorio_atual()
    )
  );

-- ============================================================================
-- Tabelas explicitamente EXCLUÍDAS de RLS (globais ou cross-tenant):
--   escritorios          — tabela de tenants em si
--   usuarios             — identidade global; tenant vem via vinculos_usuario
--   sessoes              — sessões por usuário, sem tenant
--   tokens_recuperacao   — recuperação por usuário, sem tenant
--
-- Sistema/cron/workers que precisem rodar cross-tenant devem usar uma role
-- com BYPASSRLS ou a conta `postgres`. A API regular SEMPRE seta o GUC.
-- ============================================================================
