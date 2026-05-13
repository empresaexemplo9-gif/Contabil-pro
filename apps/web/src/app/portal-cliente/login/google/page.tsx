'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { usarLojaAuth } from '@/lib/loja-auth';

export default function PaginaCallbackGoogleCliente() {
  return (
    <Suspense fallback={<Mensagem texto="Concluindo login com Google…" />}>
      <ConteudoCallback />
    </Suspense>
  );
}

function ConteudoCallback() {
  const params = useSearchParams();
  const roteador = useRouter();
  const definirTokens = usarLojaAuth((s) => s.definirTokens);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');
    const errParam = params.get('erro');

    if (errParam) {
      setErro(`Falha no login com Google (${errParam}).`);
      return;
    }
    if (!token || !refresh) {
      setErro('Resposta de autenticação incompleta.');
      return;
    }

    definirTokens(token, refresh);
    roteador.replace('/portal-cliente');
  }, [params, definirTokens, roteador]);

  if (erro) {
    return (
      <Mensagem
        texto={erro}
        acao={{ rotulo: 'Voltar', href: '/portal-cliente/login' }}
        erro
      />
    );
  }
  return <Mensagem texto="Concluindo login com Google…" />;
}

function Mensagem({
  texto,
  acao,
  erro,
}: {
  texto: string;
  acao?: { rotulo: string; href: string };
  erro?: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-2 rounded-lg border bg-card p-6 text-center text-sm">
        <p className={erro ? 'text-destructive' : 'text-muted-foreground'}>{texto}</p>
        {acao && (
          <a href={acao.href} className="text-primary hover:underline">
            {acao.rotulo}
          </a>
        )}
      </div>
    </main>
  );
}
