import Link from 'next/link';

export default function PaginaInicial() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">ContábilPro</h1>
      <p className="text-lg text-muted-foreground">
        Plataforma de gestão contábil digital — esqueleto inicial.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Entrar
        </Link>
        <Link
          href="/painel"
          className="rounded-md border px-4 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Ir ao painel
        </Link>
      </div>
    </main>
  );
}
