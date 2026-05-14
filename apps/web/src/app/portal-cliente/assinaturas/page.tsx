'use client';

import { usePortalAssinaturas } from '@/lib/hooks-portal-cliente';
import { formatarData } from '@/lib/formatadores';

const ROTULO_STATUS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  PARCIAL: 'Parcialmente assinada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
};

const ROTULO_SIGNATARIO: Record<string, string> = {
  PENDENTE: 'Pendente',
  ASSINADO: 'Assinado',
  RECUSADO: 'Recusado',
};

const COR_SIGNATARIO: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  ASSINADO: 'bg-emerald-100 text-emerald-700',
  RECUSADO: 'bg-destructive/10 text-destructive',
};

export default function PaginaPortalAssinaturas() {
  const { data, isLoading, error } = usePortalAssinaturas();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Assinaturas pendentes</h1>
        <p className="text-sm text-muted-foreground">
          Documentos da sua empresa aguardando assinatura.
        </p>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Falha ao carregar.</p>}

      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nada para assinar no momento.
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((s) => (
            <li key={s.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{s.documento.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Solicitado em {formatarData(s.criadoEm)} ·{' '}
                    {ROTULO_STATUS[s.status] ?? s.status}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {s.signatarios.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5 text-sm"
                  >
                    <div>
                      <div className="font-medium">{sig.nome}</div>
                      <div className="text-xs text-muted-foreground">{sig.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sig.assinadoEm && (
                        <span className="text-xs text-muted-foreground">
                          {formatarData(sig.assinadoEm)}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${COR_SIGNATARIO[sig.status] ?? 'bg-muted'}`}
                      >
                        {ROTULO_SIGNATARIO[sig.status] ?? sig.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                O link para assinar é enviado por e-mail pelo provedor. Caso não tenha recebido,
                fale com seu escritório.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
