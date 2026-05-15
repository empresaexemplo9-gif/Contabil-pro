'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Botao } from '@contabilpro/ui';
import { criarEmpresaSchema, type CriarEmpresaEntrada } from '@contabilpro/contracts';

interface Props {
  valoresIniciais?: Partial<CriarEmpresaEntrada>;
  textoSubmit: string;
  emEnvio: boolean;
  erro?: string | null;
  aoEnviar: (dados: CriarEmpresaEntrada) => void | Promise<void>;
}

const REGIMES: Array<{ valor: CriarEmpresaEntrada['regime']; rotulo: string }> = [
  { valor: 'SIMPLES_NACIONAL', rotulo: 'Simples Nacional' },
  { valor: 'LUCRO_PRESUMIDO', rotulo: 'Lucro Presumido' },
  { valor: 'LUCRO_REAL', rotulo: 'Lucro Real' },
  { valor: 'MEI', rotulo: 'MEI' },
  { valor: 'IMUNE_ISENTO', rotulo: 'Imune/Isento' },
];

export function FormularioEmpresa({
  valoresIniciais,
  textoSubmit,
  emEnvio,
  erro,
  aoEnviar,
}: Props) {
  const form = useForm<CriarEmpresaEntrada>({
    resolver: zodResolver(criarEmpresaSchema),
    defaultValues: {
      cnpj: valoresIniciais?.cnpj ?? '',
      razaoSocial: valoresIniciais?.razaoSocial ?? '',
      nomeFantasia: valoresIniciais?.nomeFantasia,
      inscricaoEstadual: valoresIniciais?.inscricaoEstadual,
      inscricaoMunicipal: valoresIniciais?.inscricaoMunicipal,
      regime: valoresIniciais?.regime ?? 'SIMPLES_NACIONAL',
      observacoes: valoresIniciais?.observacoes,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(aoEnviar)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="CNPJ" erro={form.formState.errors.cnpj?.message}>
          <input
            {...form.register('cnpj')}
            placeholder="00.000.000/0000-00"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Campo>
        <Campo label="Regime tributário" erro={form.formState.errors.regime?.message}>
          <select
            {...form.register('regime')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {REGIMES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo label="Razão social" erro={form.formState.errors.razaoSocial?.message}>
        <input
          {...form.register('razaoSocial')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Campo>

      <Campo label="Nome fantasia" erro={form.formState.errors.nomeFantasia?.message}>
        <input
          {...form.register('nomeFantasia')}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Inscrição estadual"
          erro={form.formState.errors.inscricaoEstadual?.message}
        >
          <input
            {...form.register('inscricaoEstadual')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Campo>
        <Campo
          label="Inscrição municipal"
          erro={form.formState.errors.inscricaoMunicipal?.message}
        >
          <input
            {...form.register('inscricaoMunicipal')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Campo>
      </div>

      <Campo label="Observações" erro={form.formState.errors.observacoes?.message}>
        <textarea
          {...form.register('observacoes')}
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Campo>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex justify-end">
        <Botao type="submit" disabled={emEnvio}>
          {emEnvio ? 'Salvando...' : textoSubmit}
        </Botao>
      </div>
    </form>
  );
}

function Campo({
  label,
  erro,
  children,
}: {
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      {children}
      {erro && <span className="mt-1 block text-xs text-destructive">{erro}</span>}
    </label>
  );
}
