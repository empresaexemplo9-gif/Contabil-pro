'use client';

import { useState, type ReactNode } from 'react';

import { BarraLateral } from '@/components/painel/barra-lateral';
import { MenuMobile } from '@/components/painel/menu-mobile';
import { Migalhas } from '@/components/painel/migalhas';
import { Topbar } from '@/components/painel/topbar';

export default function LayoutPainel({ children }: { children: ReactNode }) {
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <BarraLateral />
      <MenuMobile aberto={menuMobileAberto} aoFechar={() => setMenuMobileAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar aoAbrirMenu={() => setMenuMobileAberto(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Migalhas />
          {children}
        </main>
      </div>
    </div>
  );
}
