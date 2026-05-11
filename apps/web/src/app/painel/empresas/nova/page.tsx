'use client';

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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-sm">
        <Link href="/painel/empresas" className="text-muted-foreground hover:underline">
          ← Voltar para empresas
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Nova empresa</h1>

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
  );
}
