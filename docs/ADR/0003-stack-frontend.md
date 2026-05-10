# ADR 0003 — Stack frontend: Next.js 15 + React 19 + Tailwind + shadcn/ui

- **Status:** aceito
- **Data:** 2026-05-10

## Contexto

Precisamos escolher o stack de frontend para o portal do escritório (admin) e o portal do cliente final.

## Decisão

- **Next.js 15 (App Router)** com React 19
- **TailwindCSS** + **shadcn/ui** (componentes Radix)
- **TanStack Query** para server state
- **Zustand** para UI state local
- **React Hook Form + Zod** para formulários

## Justificativa

- **Next.js App Router:** SSR + RSC para páginas públicas com SEO; streaming para painel; rotas tipadas.
- **Tailwind + shadcn:** sem lock-in, componentes copiados para o repo (não dependência), acessíveis via Radix.
- **TanStack Query vs Redux:** server state precisa de cache/revalidação/dedupe; Query é perfeito para isso. Redux seria reinventar a roda.
- **Zustand vs Context:** Context causa re-renders cascade; Zustand tem subscrições granulares.
- **RHF + Zod:** mesmo schema valida no FE e BE (DRY) via `packages/contracts`.

## Alternativas consideradas

- **Remix:** ótimo, mas comunidade menor e menos integrações maduras com produtos brasileiros.
- **Nuxt:** Vue tem menor pool de talentos no Brasil para enterprise.
- **SPA pura (Vite + React):** perde SEO da landing e SSR do portal cliente.

## Consequências

- Time precisa entender RSC vs Client Components.
- shadcn copiado significa que atualização vem por iniciativa, não automática (vantagem de controle).
