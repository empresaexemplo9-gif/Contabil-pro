'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EstadoAuth {
  tokenAcesso: string | null;
  tokenRefresh: string | null;
  definirTokens: (acesso: string, refresh: string) => void;
  limpar: () => void;
}

export const usarLojaAuth = create<EstadoAuth>()(
  persist(
    (set) => ({
      tokenAcesso: null,
      tokenRefresh: null,
      definirTokens: (acesso, refresh) => {
        if (typeof window !== 'undefined') localStorage.setItem('token-acesso', acesso);
        set({ tokenAcesso: acesso, tokenRefresh: refresh });
      },
      limpar: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token-acesso');
        set({ tokenAcesso: null, tokenRefresh: null });
      },
    }),
    { name: 'contabilpro-auth' },
  ),
);
