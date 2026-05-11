export function formatarCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatarData(data: Date | string | null): string {
  if (!data) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}

const REGIMES_LABEL: Record<string, string> = {
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
  MEI: 'MEI',
  IMUNE_ISENTO: 'Imune/Isento',
};

export function rotuloRegime(regime: string): string {
  return REGIMES_LABEL[regime] ?? regime;
}

const STATUS_LABEL: Record<string, string> = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  ENCERRADA: 'Encerrada',
};

export function rotuloStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}
