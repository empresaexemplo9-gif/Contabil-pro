'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { clienteApi } from '@/lib/cliente-api';

interface Props {
  audiencia: 'escritorio' | 'portal-cliente';
}

export function BotaoGoogle({ audiencia }: Props) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['google', 'disponivel'],
    queryFn: () => clienteApi.get<{ disponivel: boolean }>('/auth/google/disponivel'),
    staleTime: 10 * 60_000,
  });

  if (!data?.disponivel) return null;

  async function entrar() {
    setErro(null);
    setCarregando(true);
    try {
      const { url } = await clienteApi.get<{ url: string }>(
        `/auth/google/iniciar?audiencia=${audiencia}`,
      );
      window.location.href = url;
    } catch {
      setErro('Não foi possível iniciar o login com Google.');
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={entrar}
        disabled={carregando}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        <LogoGoogle />
        {carregando ? 'Redirecionando…' : 'Continuar com Google'}
      </button>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}

function LogoGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.7-3.4-11.3-8L6.3 32.6C9.5 39.2 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.3 36.7 44 30.9 44 24c0-1.34-.14-2.65-.4-3.5z"
      />
    </svg>
  );
}
