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

const STATUS_TAREFA_LABEL: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  ATRASADA: 'Atrasada',
  CANCELADA: 'Cancelada',
};

export function rotuloStatusTarefa(status: string): string {
  return STATUS_TAREFA_LABEL[status] ?? status;
}

const PRIORIDADE_LABEL: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function rotuloPrioridade(prioridade: string): string {
  return PRIORIDADE_LABEL[prioridade] ?? prioridade;
}

const FREQUENCIA_LABEL: Record<string, string> = {
  UNICA: 'Única',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export function rotuloFrequencia(frequencia: string): string {
  return FREQUENCIA_LABEL[frequencia] ?? frequencia;
}

export function formatarBytes(bytes: number | bigint): string {
  const n = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
