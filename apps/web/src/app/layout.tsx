import type { Metadata } from 'next';

import { ProvedorTema } from '@/components/provedor-tema';
import { ProvedorReactQuery } from '@/lib/provedor-react-query';
import './globals.css';

export const metadata: Metadata = {
  title: 'ContábilPro',
  description: 'Plataforma de gestão contábil digital',
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ProvedorTema>
          <ProvedorReactQuery>{children}</ProvedorReactQuery>
        </ProvedorTema>
      </body>
    </html>
  );
}
