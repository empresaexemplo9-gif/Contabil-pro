/**
 * Adapter portátil para a API da Resend (envio de e-mail transacional).
 * Documentação: https://resend.com/docs/api-reference/emails/send-email
 *
 * Sem dependência de Nest/Prisma; consumido pela API server e pelo worker
 * (job `enviar-email`). Usa apenas `fetch`, disponível no Node 18+.
 */

const URL_BASE = 'https://api.resend.com';

export interface CredenciaisResend {
  apiKey: string;
}

export interface EnviarEmailEntrada {
  /** Remetente no formato "Nome <email@dominio>" ou apenas o e-mail. */
  de: string;
  para: string | string[];
  assunto: string;
  corpoHtml: string;
  /** Versão texto puro — recomendada para entregabilidade. */
  corpoTexto?: string;
  /** Endereço de resposta, se diferente do remetente. */
  responderPara?: string;
}

export interface EmailEnviado {
  /** id da mensagem na Resend — útil para rastrear webhooks de entrega. */
  externalId: string;
}

export async function enviarEmail(
  credenciais: CredenciaisResend,
  dados: EnviarEmailEntrada,
): Promise<EmailEnviado> {
  const corpo = {
    from: dados.de,
    to: dados.para,
    subject: dados.assunto,
    html: dados.corpoHtml,
    ...(dados.corpoTexto ? { text: dados.corpoTexto } : {}),
    ...(dados.responderPara ? { reply_to: dados.responderPara } : {}),
  };

  const resposta = await fetch(`${URL_BASE}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credenciais.apiKey}`,
    },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha ao enviar e-mail Resend (HTTP ${resposta.status}): ${erro}`);
  }

  const resultado = (await resposta.json()) as { id?: string };
  if (!resultado.id) throw new Error('Resposta da Resend sem id');
  return { externalId: resultado.id };
}
