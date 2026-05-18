-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "StatusEscritorio" AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PlanoEscritorio" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'CONVIDADO', 'BLOQUEADO', 'DESATIVADO');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('PROPRIETARIO', 'ADMIN', 'CONTADOR', 'ASSISTENTE', 'CLIENTE');

-- CreateEnum
CREATE TYPE "RegimeTributario" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI', 'IMUNE_ISENTO');

-- CreateEnum
CREATE TYPE "StatusEmpresa" AS ENUM ('ATIVA', 'INATIVA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('ATIVO', 'ARQUIVADO', 'EXCLUIDO');

-- CreateEnum
CREATE TYPE "StatusSolicitacaoAssinatura" AS ENUM ('RASCUNHO', 'ENVIADA', 'PARCIAL', 'CONCLUIDA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "StatusSignatario" AS ENUM ('PENDENTE', 'ASSINADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "FrequenciaObrigacao" AS ENUM ('UNICA', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "CanalConversa" AS ENUM ('PORTAL', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "StatusConversa" AS ENUM ('ABERTA', 'AGUARDANDO_CLIENTE', 'EM_ATENDIMENTO', 'RESOLVIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('TAREFA_ATRIBUIDA', 'TAREFA_VENCENDO', 'DOCUMENTO_NOVO', 'ASSINATURA_PENDENTE', 'ASSINATURA_CONCLUIDA', 'MENSAGEM_NOVA', 'AUTOMACAO_FALHOU', 'SISTEMA');

-- CreateEnum
CREATE TYPE "CanalNotificacao" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "StatusAutomacao" AS ENUM ('ATIVA', 'PAUSADA', 'RASCUNHO');

-- CreateEnum
CREATE TYPE "StatusExecucaoAutomacao" AS ENUM ('EXECUTANDO', 'CONCLUIDA', 'FALHOU', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ProvedorIntegracao" AS ENUM ('WHATSAPP_CLOUD', 'RESEND', 'ZAPSIGN', 'CLICKSIGN', 'D4SIGN', 'CUSTOMIZADA');

-- CreateEnum
CREATE TYPE "StatusIntegracao" AS ENUM ('ATIVA', 'INATIVA', 'ERRO');

-- CreateTable
CREATE TABLE "escritorios" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "plano" "PlanoEscritorio" NOT NULL DEFAULT 'STARTER',
    "status" "StatusEscritorio" NOT NULL DEFAULT 'ATIVO',
    "configuracoes" JSONB NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escritorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT,
    "nome" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "status" "StatusUsuario" NOT NULL DEFAULT 'CONVIDADO',
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "mfaSegredo" TEXT,
    "mfaAtivo" BOOLEAN NOT NULL DEFAULT false,
    "ultimoLoginEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculos_usuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "empresaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculos_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "geracaoToken" INTEGER NOT NULL DEFAULT 0,
    "refreshTokenHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogadaEm" TIMESTAMP(3),
    "motivoRevogacao" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "regime" "RegimeTributario" NOT NULL,
    "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA',
    "dataAbertura" TIMESTAMP(3),
    "endereco" JSONB,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contatos_empresa" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cargo" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contatos_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_documento" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "diasRetencao" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "empresaId" TEXT,
    "categoriaId" TEXT,
    "nome" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" BIGINT NOT NULL,
    "chaveStorage" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "versaoAtual" INTEGER NOT NULL DEFAULT 1,
    "status" "StatusDocumento" NOT NULL DEFAULT 'ATIVO',
    "metadados" JSONB NOT NULL DEFAULT '{}',
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versoes_documento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "chaveStorage" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "tamanhoBytes" BIGINT NOT NULL,
    "notas" TEXT,
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versoes_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_assinatura" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "StatusSolicitacaoAssinatura" NOT NULL DEFAULT 'RASCUNHO',
    "expiraEm" TIMESTAMP(3),
    "enviadaEm" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatarios" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusSignatario" NOT NULL DEFAULT 'PENDENTE',
    "assinadoEm" TIMESTAMP(3),
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos_obrigacao" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "frequencia" "FrequenciaObrigacao" NOT NULL,
    "diaVencimento" INTEGER,
    "regimes" "RegimeTributario"[] DEFAULT ARRAY[]::"RegimeTributario"[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modelos_obrigacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "empresaId" TEXT,
    "modeloId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "concluidaEm" TIMESTAMP(3),
    "responsavelId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "empresaId" TEXT,
    "canal" "CanalConversa" NOT NULL,
    "assunto" TEXT,
    "status" "StatusConversa" NOT NULL DEFAULT 'ABERTA',
    "slaVencimentoEm" TIMESTAMP(3),
    "ultimaMensagemEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "remetenteId" TEXT,
    "corpo" TEXT NOT NULL,
    "anexos" JSONB NOT NULL DEFAULT '[]',
    "externalId" TEXT,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "canal" "CanalNotificacao" NOT NULL DEFAULT 'IN_APP',
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "lidaEm" TIMESTAMP(3),
    "enviadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automacoes" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "gatilho" JSONB NOT NULL,
    "passos" JSONB NOT NULL,
    "status" "StatusAutomacao" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_automacao" (
    "id" TEXT NOT NULL,
    "automacaoId" TEXT NOT NULL,
    "status" "StatusExecucaoAutomacao" NOT NULL DEFAULT 'EXECUTANDO',
    "contexto" JSONB NOT NULL DEFAULT '{}',
    "erro" TEXT,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),

    CONSTRAINT "execucoes_automacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integracoes" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "provedor" "ProvedorIntegracao" NOT NULL,
    "nome" TEXT NOT NULL,
    "credenciais" JSONB NOT NULL,
    "configuracoes" JSONB NOT NULL DEFAULT '{}',
    "status" "StatusIntegracao" NOT NULL DEFAULT 'INATIVA',
    "ultimoErro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_webhook" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT,
    "origem" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "cabecalhos" JSONB NOT NULL DEFAULT '{}',
    "processadoEm" TIMESTAMP(3),
    "erro" TEXT,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "escritorioId" TEXT NOT NULL,
    "atorId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "diff" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escritorios_slug_key" ON "escritorios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "escritorios_cnpj_key" ON "escritorios"("cnpj");

-- CreateIndex
CREATE INDEX "escritorios_status_idx" ON "escritorios"("status");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE INDEX "usuarios_status_idx" ON "usuarios"("status");

-- CreateIndex
CREATE INDEX "vinculos_usuario_escritorioId_papel_idx" ON "vinculos_usuario"("escritorioId", "papel");

-- CreateIndex
CREATE UNIQUE INDEX "vinculos_usuario_usuarioId_escritorioId_key" ON "vinculos_usuario"("usuarioId", "escritorioId");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_refreshTokenHash_key" ON "sessoes"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "sessoes_usuarioId_idx" ON "sessoes"("usuarioId");

-- CreateIndex
CREATE INDEX "sessoes_familiaId_idx" ON "sessoes"("familiaId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacao_tokenHash_key" ON "tokens_recuperacao"("tokenHash");

-- CreateIndex
CREATE INDEX "tokens_recuperacao_usuarioId_usadoEm_idx" ON "tokens_recuperacao"("usuarioId", "usadoEm");

-- CreateIndex
CREATE INDEX "empresas_escritorioId_status_idx" ON "empresas"("escritorioId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_escritorioId_cnpj_key" ON "empresas"("escritorioId", "cnpj");

-- CreateIndex
CREATE INDEX "contatos_empresa_empresaId_idx" ON "contatos_empresa"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_documento_escritorioId_nome_key" ON "categorias_documento"("escritorioId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_chaveStorage_key" ON "documentos"("chaveStorage");

-- CreateIndex
CREATE INDEX "documentos_escritorioId_empresaId_idx" ON "documentos"("escritorioId", "empresaId");

-- CreateIndex
CREATE INDEX "documentos_escritorioId_categoriaId_idx" ON "documentos"("escritorioId", "categoriaId");

-- CreateIndex
CREATE INDEX "documentos_escritorioId_status_idx" ON "documentos"("escritorioId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "versoes_documento_chaveStorage_key" ON "versoes_documento"("chaveStorage");

-- CreateIndex
CREATE UNIQUE INDEX "versoes_documento_documentoId_versao_key" ON "versoes_documento"("documentoId", "versao");

-- CreateIndex
CREATE INDEX "solicitacoes_assinatura_escritorioId_status_idx" ON "solicitacoes_assinatura"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "signatarios_solicitacaoId_idx" ON "signatarios"("solicitacaoId");

-- CreateIndex
CREATE INDEX "modelos_obrigacao_escritorioId_ativo_idx" ON "modelos_obrigacao"("escritorioId", "ativo");

-- CreateIndex
CREATE INDEX "tarefas_escritorioId_status_idx" ON "tarefas"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "tarefas_escritorioId_dataVencimento_idx" ON "tarefas"("escritorioId", "dataVencimento");

-- CreateIndex
CREATE INDEX "tarefas_responsavelId_idx" ON "tarefas"("responsavelId");

-- CreateIndex
CREATE INDEX "conversas_escritorioId_status_idx" ON "conversas"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "conversas_escritorioId_canal_idx" ON "conversas"("escritorioId", "canal");

-- CreateIndex
CREATE INDEX "mensagens_conversaId_criadoEm_idx" ON "mensagens"("conversaId", "criadoEm");

-- CreateIndex
CREATE INDEX "notificacoes_usuarioId_lidaEm_idx" ON "notificacoes"("usuarioId", "lidaEm");

-- CreateIndex
CREATE INDEX "notificacoes_escritorioId_tipo_idx" ON "notificacoes"("escritorioId", "tipo");

-- CreateIndex
CREATE INDEX "automacoes_escritorioId_status_idx" ON "automacoes"("escritorioId", "status");

-- CreateIndex
CREATE INDEX "execucoes_automacao_automacaoId_status_idx" ON "execucoes_automacao"("automacaoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "integracoes_escritorioId_provedor_nome_key" ON "integracoes"("escritorioId", "provedor", "nome");

-- CreateIndex
CREATE INDEX "eventos_webhook_origem_processadoEm_idx" ON "eventos_webhook"("origem", "processadoEm");

-- CreateIndex
CREATE INDEX "logs_auditoria_escritorioId_entidade_entidadeId_idx" ON "logs_auditoria"("escritorioId", "entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "logs_auditoria_escritorioId_criadoEm_idx" ON "logs_auditoria"("escritorioId", "criadoEm");

-- AddForeignKey
ALTER TABLE "vinculos_usuario" ADD CONSTRAINT "vinculos_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_usuario" ADD CONSTRAINT "vinculos_usuario_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculos_usuario" ADD CONSTRAINT "vinculos_usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_recuperacao" ADD CONSTRAINT "tokens_recuperacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contatos_empresa" ADD CONSTRAINT "contatos_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_documento" ADD CONSTRAINT "categorias_documento_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_documento" ADD CONSTRAINT "versoes_documento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_assinatura" ADD CONSTRAINT "solicitacoes_assinatura_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_assinatura" ADD CONSTRAINT "solicitacoes_assinatura_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatarios" ADD CONSTRAINT "signatarios_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_assinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modelos_obrigacao" ADD CONSTRAINT "modelos_obrigacao_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos_obrigacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automacoes" ADD CONSTRAINT "automacoes_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_automacao" ADD CONSTRAINT "execucoes_automacao_automacaoId_fkey" FOREIGN KEY ("automacaoId") REFERENCES "automacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integracoes" ADD CONSTRAINT "integracoes_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_webhook" ADD CONSTRAINT "eventos_webhook_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "escritorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_atorId_fkey" FOREIGN KEY ("atorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

