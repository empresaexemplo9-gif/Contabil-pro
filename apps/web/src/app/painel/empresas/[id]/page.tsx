'use client';

import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { FormularioEmpresa } from '@/components/formulario-empresa';
import { PainelContatos } from '@/components/painel-contatos';
import { useAtualizarEmpresa, useEmpresa } from '@/lib/hooks-empresas';
import { formatarCnpj, formatarData, rotuloRegime, rotuloStatus } from '@/lib/formatadores';
import { ErroApi } from '@/lib/cliente-api';

export default function PaginaEmpresa() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const consulta = useEmpresa(id);
  const atualizar = useAtualizarEmpresa(id);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (consulta.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (consulta.isError || !consulta.data) {
    return <p className="text-sm text-destructive">Empresa não encontrada.</p>;
  }

  const empresa = consulta.data;

  return (
    <div className="space-y-6">
      <Link
        href="/painel/empresas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para empresas
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            {empresa.razaoSocial}
          </h1>
          {empresa.nomeFantasia && (
            <p className="text-sm text-muted-foreground">{empresa.nomeFantasia}</p>
          )}
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {formatarCnpj(empresa.cnpj)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          <span
            className={
              empresa.status === 'ATIVA'
                ? 'inline-flex items-center rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-medium text-secondary'
                : 'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
            }
          >
            {rotuloStatus(empresa.status)}
          </span>
          <p className="text-muted-foreground">{rotuloRegime(empresa.regime)}</p>
          <p className="text-xs text-muted-foreground">
            Cadastrada em {formatarData(empresa.criadoEm)}
          </p>
        </div>
      </header>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Dados cadastrais</h2>
          {!editando && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-sm transition hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <FormularioEmpresa
            valoresIniciais={{
              cnpj: empresa.cnpj,
              razaoSocial: empresa.razaoSocial,
              nomeFantasia: empresa.nomeFantasia ?? undefined,
              inscricaoEstadual: empresa.inscricaoEstadual ?? undefined,
              inscricaoMunicipal: empresa.inscricaoMunicipal ?? undefined,
              regime: empresa.regime,
              observacoes: empresa.observacoes ?? undefined,
            }}
            textoSubmit="Salvar alterações"
            emEnvio={atualizar.isPending}
            erro={erro}
            aoEnviar={async (dados) => {
              setErro(null);
              try {
                await atualizar.mutateAsync(dados);
                setEditando(false);
              } catch (e) {
                if (e instanceof ErroApi && e.status === 409) {
                  setErro('Já existe outra empresa com este CNPJ.');
                } else {
                  setErro('Não foi possível salvar as alterações.');
                }
              }
            }}
          />
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Linha rotulo="Inscrição estadual" valor={empresa.inscricaoEstadual} />
            <Linha rotulo="Inscrição municipal" valor={empresa.inscricaoMunicipal} />
            <Linha rotulo="Data de abertura" valor={formatarData(empresa.dataAbertura)} />
            <Linha rotulo="Última atualização" valor={formatarData(empresa.atualizadoEm)} />
            {empresa.observacoes && (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Observações
                </dt>
                <dd className="mt-1 whitespace-pre-line">{empresa.observacoes}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <PainelContatos empresaId={empresa.id} contatos={empresa.contatos} />
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5">{valor ?? '—'}</dd>
    </div>
  );
}
