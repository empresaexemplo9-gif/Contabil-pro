export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function formatarCnpj(valor: string): string {
  const d = apenasDigitos(valor).padStart(14, '0').slice(0, 14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatarCpf(valor: string): string {
  const d = apenasDigitos(valor).padStart(11, '0').slice(0, 11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function validarCnpj(valor: string): boolean {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calcularDigito = (base: string): number => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base
      .split('')
      .reduce((acc, digito, i) => acc + Number(digito) * (pesos[i] ?? 0), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const base = cnpj.slice(0, 12);
  return (
    calcularDigito(base) === Number(cnpj[12]) &&
    calcularDigito(base + cnpj[12]) === Number(cnpj[13])
  );
}

export function adiarSegundos(segundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, segundos * 1000));
}

export function calcularProximoVencimento(diaVencimento: number, referencia: Date = new Date()): Date {
  const data = new Date(referencia.getFullYear(), referencia.getMonth(), diaVencimento);
  if (data <= referencia) data.setMonth(data.getMonth() + 1);
  return data;
}

export class ErroAplicacao extends Error {
  constructor(
    public readonly codigo: string,
    public readonly mensagem: string,
    public readonly statusHttp: number = 400,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = 'ErroAplicacao';
  }
}
