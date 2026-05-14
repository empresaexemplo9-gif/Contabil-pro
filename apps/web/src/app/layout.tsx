import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import { ProvedorTema } from '@/components/provedor-tema';
import { ProvedorReactQuery } from '@/lib/provedor-react-query';
import './globals.css';

const fonteSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fonte-sans',
});

const fonteSerif = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--fonte-serif',
});

export const metadata: Metadata = {
  title: 'ContábilPro',
  description: 'Plataforma de gestão contábil digital',
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fonteSans.variable} ${fonteSerif.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ProvedorTema>
          <ProvedorReactQuery>{children}</ProvedorReactQuery>
        </ProvedorTema>
      </body>
    </html>
  );
}
