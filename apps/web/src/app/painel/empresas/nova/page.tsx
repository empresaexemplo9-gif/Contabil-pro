'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormularioEmpresa } from '@/components/formulario-empresa';
import { useCriarEmpresa } from '@/lib/hooks-empresas';
import { ErroApi } from '@/lib/cliente-api';

export default function PaginaNovaEmpresa() {
  const roteador = useRouter();
  const criar = useCriarEmpresa();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/painel/empresas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para empresas
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Nova empresa</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre uma empresa para começar a gerenciar tarefas, documentos e obrigações.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-card-soft">
        <FormularioEmpresa
          textoSubmit="Cadastrar empresa"
          emEnvio={criar.isPending}
          erro={erro}
          aoEnviar={async (dados) => {
            setErro(null);
            try {
              const empresa = await criar.mutateAsync(dados);
              roteador.push(`/painel/empresas/${empresa.id}`);
            } catch (e) {
              if (e instanceof ErroApi && e.status === 409) {
                setErro('Já existe uma empresa com este CNPJ.');
              } else {
                setErro('Não foi possível cadastrar a empresa.');
              }
            }
          }}
        />
      </div>
    </div>
  );
}
