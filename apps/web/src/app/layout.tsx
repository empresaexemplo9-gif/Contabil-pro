import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ProvedorReactQuery } from '@/lib/provedor-react-query';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--fonte-sans' });

export const metadata: Metadata = {
  title: 'ContábilPro',
  description: 'Plataforma de gestão contábil digital',
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ProvedorReactQuery>{children}</ProvedorReactQuery>
      </body>
    </html>
  );
}
