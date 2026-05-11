/**
 * Cliente mínimo para a WhatsApp Cloud API (Meta Graph) usado pelo worker.
 * Mantemos uma cópia do adapter aqui em vez de criar um pacote compartilhado
 * — a superfície é pequena e a duplicação evita acoplamento entre apps.
 */

const URL_BASE = 'https://graph.facebook.com/v20.0';

export interface CredenciaisWhatsapp {
  phoneNumberId: string;
  token: string;
}

export async function enviarMensagemTexto(
  credenciais: CredenciaisWhatsapp,
  para: string,
  texto: string,
): Promise<{ wamid: string }> {
  const resposta = await fetch(`${URL_BASE}/${credenciais.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credenciais.token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: para,
      type: 'text',
      text: { preview_url: false, body: texto },
    }),
  });
  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha ao enviar WhatsApp (HTTP ${resposta.status}): ${erro}`);
  }
  const dados = (await resposta.json()) as { messages?: Array<{ id: string }> };
  const wamid = dados.messages?.[0]?.id;
  if (!wamid) throw new Error('Resposta da Graph API sem wamid');
  return { wamid };
}
