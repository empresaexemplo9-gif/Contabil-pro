'use client';

import { useState } from 'react';

import {
  useCriarIntegracao,
  useDesativarIntegracao,
  useIntegracoes,
  useRemoverIntegracao,
  type IntegracaoResumo,
} from '@/lib/hooks-configuracoes';
import { formatarData } from '@/lib/formatadores';

const ROTULO_PROVEDOR: Record<string, string> = {
  WHATSAPP_CLOUD: 'WhatsApp Cloud',
  RESEND: 'Resend (e-mail)',
  ZAPSIGN: 'ZapSign',
  CLICKSIGN: 'Clicksign',
  D4SIGN: 'D4Sign',
  CUSTOMIZADA: 'Customizada',
};

type Provedor = keyof typeof ROTULO_PROVEDOR;

export function AbaIntegracoes() {
  const { data, isLoading, error } = useIntegracoes();
  const [aberto, setAberto] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Conecte WhatsApp, e-mail transacional e provedores de assinatura eletrônica.
        </p>
        <button
          onClick={() => setAberto(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Nova integração
        </button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && <p className="text-sm text-destructive">Falha ao carregar integrações.</p>}

      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nenhuma integração configurada ainda.
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((i) => (
            <CartaoIntegracao key={i.id} integracao={i} />
          ))}
        </ul>
      )}

      {aberto && <ModalNovaIntegracao aoFechar={() => setAberto(false)} />}
    </div>
  );
}

function CartaoIntegracao({ integracao }: { integracao: IntegracaoResumo }) {
  const desativar = useDesativarIntegracao();
  const remover = useRemoverIntegracao();

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{integracao.nome}</div>
          <div className="text-xs text-muted-foreground">
            {ROTULO_PROVEDOR[integracao.provedor] ?? integracao.provedor}
          </div>
        </div>
        <BadgeStatus status={integracao.status} />
      </div>
      {integracao.ultimoErro && (
        <div className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          {integracao.ultimoErro}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Adicionada em {formatarData(integracao.criadoEm)}</span>
        <div className="flex gap-2">
          {integracao.status === 'ATIVA' && (
            <button
              onClick={() => desativar.mutate(integracao.id)}
              disabled={desativar.isPending}
              className="rounded border px-2 py-0.5 hover:bg-accent"
            >
              Desativar
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Remover integração "${integracao.nome}"?`)) {
                remover.mutate(integracao.id);
              }
            }}
            disabled={remover.isPending}
            className="rounded border border-destructive/30 px-2 py-0.5 text-destructive hover:bg-destructive/10"
          >
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}

function BadgeStatus({ status }: { status: IntegracaoResumo['status'] }) {
  const cor =
    status === 'ATIVA'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'ERRO'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-muted text-muted-foreground';
  const rotulo = status === 'ATIVA' ? 'Ativa' : status === 'ERRO' ? 'Erro' : 'Inativa';
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cor}`}>{rotulo}</span>;
}

function ModalNovaIntegracao({ aoFechar }: { aoFechar: () => void }) {
  const criar = useCriarIntegracao();
  const [provedor, setProvedor] = useState<Provedor>('WHATSAPP_CLOUD');
  const [nome, setNome] = useState('');
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  const definicaoCampos = camposPorProvedor(provedor);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const credenciais: Record<string, string> = {};
    for (const c of definicaoCampos) {
      const valor = campos[c.chave]?.trim() ?? '';
      if (c.obrigatorio && !valor) {
        setErro(`Campo "${c.rotulo}" é obrigatório.`);
        return;
      }
      if (valor) credenciais[c.chave] = valor;
    }
    try {
      await criar.mutateAsync({ provedor, nome, credenciais, ativar: true });
      aoFechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao salvar.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-md rounded-lg bg-card p-5 shadow-lg"
      >
        <h3 className="text-lg font-semibold">Nova integração</h3>

        <label className="mt-4 block text-sm">
          <span className="text-muted-foreground">Provedor</span>
          <select
            value={provedor}
            onChange={(e) => {
              setProvedor(e.target.value as Provedor);
              setCampos({});
            }}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {Object.entries(ROTULO_PROVEDOR).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm">
          <span className="text-muted-foreground">Nome amigável</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            placeholder="Ex: WhatsApp principal"
          />
        </label>

        <div className="mt-3 space-y-2">
          {definicaoCampos.map((c) => (
            <label key={c.chave} className="block text-sm">
              <span className="text-muted-foreground">
                {c.rotulo}
                {c.obrigatorio ? ' *' : ''}
              </span>
              <input
                type={c.sensivel ? 'password' : 'text'}
                value={campos[c.chave] ?? ''}
                onChange={(e) =>
                  setCampos((atual) => ({ ...atual, [c.chave]: e.target.value }))
                }
                className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm"
                placeholder={c.placeholder}
              />
            </label>
          ))}
        </div>

        {erro && (
          <p className="mt-3 rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={criar.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {criar.isPending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface DefCampo {
  chave: string;
  rotulo: string;
  obrigatorio: boolean;
  sensivel?: boolean;
  placeholder?: string;
}

function camposPorProvedor(provedor: Provedor): DefCampo[] {
  switch (provedor) {
    case 'WHATSAPP_CLOUD':
      return [
        { chave: 'phoneNumberId', rotulo: 'Phone Number ID', obrigatorio: true },
        { chave: 'token', rotulo: 'Token de acesso', obrigatorio: true, sensivel: true },
        { chave: 'verifyToken', rotulo: 'Verify Token', obrigatorio: false },
      ];
    case 'RESEND':
      return [{ chave: 'apiKey', rotulo: 'API Key', obrigatorio: true, sensivel: true }];
    case 'ZAPSIGN':
    case 'CLICKSIGN':
    case 'D4SIGN':
      return [
        { chave: 'apiKey', rotulo: 'API Key', obrigatorio: true, sensivel: true },
        { chave: 'baseUrl', rotulo: 'URL base', obrigatorio: false },
      ];
    default:
      return [
        { chave: 'apiKey', rotulo: 'Chave', obrigatorio: false, sensivel: true },
        { chave: 'segredo', rotulo: 'Segredo', obrigatorio: false, sensivel: true },
        { chave: 'baseUrl', rotulo: 'URL base', obrigatorio: false },
      ];
  }
}
