'use client';

import { LogOut, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { clienteApi } from '@/lib/cliente-api';
import { usarLojaAuth } from '@/lib/loja-auth';

interface PerfilUsuario {
  id: string;
  email: string;
  nome: string;
  avatarUrl: string | null;
  mfaAtivo: boolean;
  vinculos: Array<{ escritorioId: string; papel: string; permissoes: string[] }>;
}

const ROTULO_PAPEL: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  ADMIN: 'Admin',
  CONTADOR: 'Contador',
  ASSISTENTE: 'Assistente',
  CLIENTE: 'Cliente',
};

export function MenuUsuario() {
  const roteador = useRouter();
  const limpar = usarLojaAuth((s) => s.limpar);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['perfil', 'eu'],
    queryFn: () => clienteApi.get<PerfilUsuario>('/usuarios/eu'),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    function aoClicar(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false);
    }
    if (aberto) {
      document.addEventListener('mousedown', aoClicar);
      return () => document.removeEventListener('mousedown', aoClicar);
    }
  }, [aberto]);

  function sair() {
    limpar();
    roteador.replace('/login');
  }

  const iniciais =
    data?.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') ?? '?';
  const papel = data?.vinculos[0]?.papel;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-md p-1 hover:bg-muted"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {iniciais}
        </span>
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="text-xs font-medium">{data?.nome ?? '—'}</span>
          <span className="text-[10px] text-muted-foreground">
            {papel ? ROTULO_PAPEL[papel] ?? papel : ''}
          </span>
        </span>
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-card-soft">
          <div className="border-b border-border p-3">
            <div className="text-sm font-medium">{data?.nome ?? '—'}</div>
            <div className="truncate text-xs text-muted-foreground">{data?.email ?? ''}</div>
            {papel && (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                <ShieldCheck className="h-3 w-3" />
                {ROTULO_PAPEL[papel] ?? papel}
              </div>
            )}
          </div>
          <ul className="py-1 text-sm">
            <li>
              <Link
                href="/painel/configuracoes"
                onClick={() => setAberto(false)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted"
              >
                <User className="h-3.5 w-3.5" />
                Meu perfil
              </Link>
            </li>
            <li>
              <button
                onClick={sair}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-destructive hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
