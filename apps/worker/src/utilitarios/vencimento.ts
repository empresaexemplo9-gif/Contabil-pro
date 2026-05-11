/**
 * Calcula o vencimento para (ano, mês, diaPretendido) tratando meses com
 * menos dias: 31 em fevereiro vira 28/29 conforme o ano. Horário fixo em
 * 12:00 UTC para evitar surpresas com fuso horário.
 */
export function calcularVencimento(ano: number, mes: number, dia: number): Date {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaSeguro = Math.min(dia, ultimoDia);
  return new Date(Date.UTC(ano, mes - 1, diaSeguro, 12, 0, 0));
}

export function proximoMes(referencia: Date = new Date()): { mes: number; ano: number } {
  const mesZero = referencia.getMonth();
  const ano = referencia.getFullYear();
  if (mesZero === 11) return { mes: 1, ano: ano + 1 };
  return { mes: mesZero + 2, ano };
}
