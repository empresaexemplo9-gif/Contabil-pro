'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

import { SidebarMobile } from './barra-lateral';

export function MenuMobile({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={aoFechar}
        aria-hidden
      />
      <div className="absolute left-0 top-0 h-full w-64 shadow-xl">
        <button
          onClick={aoFechar}
          aria-label="Fechar menu"
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarMobile aoNavegar={aoFechar} />
      </div>
    </div>
  );
}
