import Link from 'next/link';

export default function PaginaInicial() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-primary p-6 text-primary-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 30%, hsl(var(--accent)) 0, transparent 40%), radial-gradient(circle at 75% 70%, hsl(var(--secondary)) 0, transparent 40%)',
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-2 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary text-accent ring-1 ring-accent/40">
          <span className="font-serif text-2xl font-semibold">C</span>
        </span>
        <span className="mt-2 text-xs uppercase tracking-[0.3em] text-accent/80">
          Banco · Patrimônio · Confiança
        </span>
        <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
          Contábil<span className="text-accent">Pro</span>
        </h1>
        <div className="mt-1 h-px w-40 bg-accent/40" />
        <p className="mt-3 max-w-md text-sm text-primary-foreground/80">
          Gestão contábil digital com a sobriedade de um private bank. Documentos,
          obrigações, atendimento e portal do cliente em uma única plataforma.
        </p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent/90"
        >
          Acesso do escritório
        </Link>
        <Link
          href="/portal-cliente/login"
          className="rounded-md border border-accent/40 px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-accent/10"
        >
          Portal do cliente
        </Link>
      </div>

      <div className="relative mt-10 text-[10px] uppercase tracking-[0.25em] text-primary-foreground/40">
        © {new Date().getFullYear()} ContábilPro
      </div>
    </main>
  );
}
