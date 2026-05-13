'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { usePortalResumo } from '@/lib/hooks-portal-cliente';
import { usarLojaAuth } from '@/lib/loja-auth';

const ITENS_MENU = [
  { href: '/portal-cliente', titulo: 'Visão geral' },
  { href: '/portal-cliente/documentos', titulo: 'Documentos' },
  { href: '/portal-cliente/obrigacoes', titulo: 'Obrigações' },
  { href: '/portal-cliente/assinaturas', titulo: 'Assinaturas' },
  { href: '/portal-cliente/mensagens', titulo: 'Mensagens' },
] as const;

export default function LayoutPortalCliente({ children }: { children: ReactNode }) {
  const roteador = useRouter();
  const caminho = usePathname();
  const tokenAcesso = usarLojaAuth((s) => s.tokenAcesso);
  const limpar = usarLojaAuth((s) => s.limpar);

  const ehLogin = caminho === '/portal-cliente/login';

  useEffect(() => {
    if (!tokenAcesso && !ehLogin) {
      roteador.replace('/portal-cliente/login');
    }
  }, [tokenAcesso, ehLogin, roteador]);

  if (ehLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">ContábilPro</span>
            <CabecalhoEmpresa />
          </div>
          <button
            onClick={() => {
              limpar();
              roteador.replace('/portal-cliente/login');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {ITENS_MENU.map((item) => {
            const ativo =
              item.href === '/portal-cliente'
                ? caminho === item.href
                : caminho?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
                  ativo
                    ? 'border-primary font-medium text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.titulo}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

function CabecalhoEmpresa() {
  const resumo = usePortalResumo();
  if (!resumo.data) return null;
  return (
    <span className="hidden text-sm text-muted-foreground sm:inline">
      · {resumo.data.empresa.nomeFantasia ?? resumo.data.empresa.razaoSocial}
    </span>
  );
}
