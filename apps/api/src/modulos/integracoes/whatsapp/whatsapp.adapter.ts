/**
 * Adapter para a WhatsApp Cloud API (Meta Graph). Cobre o subconjunto que
 * usamos: envio de mensagens de texto e parsing do payload de webhook.
 *
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Mantemos o adapter sem dependência de Nest para reuso pelo worker.
 */

const URL_BASE = 'https://graph.facebook.com/v20.0';

export interface CredenciaisWhatsapp {
  phoneNumberId: string;
  token: string;
  /** Token configurado no painel da Meta para validação do webhook. */
  verifyToken?: string;
}

export interface MensagemRecebida {
  /** id da mensagem (wamid) — usar como externalId para dedup. */
  externalId: string;
  /** Telefone do remetente, em formato E.164 (sem '+'). */
  remetenteTelefone: string;
  /** Nome de perfil informado pelo WhatsApp, se disponível. */
  remetenteNome?: string;
  /** Texto da mensagem (mensagens não-texto retornam um placeholder). */
  texto: string;
  timestamp: Date;
}

export interface EventoWebhook {
  /** Conjunto de phoneNumberIds afetados — usado para rotear ao tenant. */
  phoneNumberIds: Set<string>;
  mensagens: Array<MensagemRecebida & { phoneNumberId: string }>;
}

export async function enviarMensagemTexto(
  credenciais: CredenciaisWhatsapp,
  para: string,
  texto: string,
): Promise<{ wamid: string }> {
  const corpo = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: para,
    type: 'text',
    text: { preview_url: false, body: texto },
  };
  const resposta = await fetch(`${URL_BASE}/${credenciais.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credenciais.token}`,
    },
    body: JSON.stringify(corpo),
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

/**
 * Parsing do payload de webhook do WhatsApp Cloud API. Aceita apenas o
 * formato oficial; campos faltantes são ignorados em vez de quebrar.
 */
export function parsearWebhook(payload: unknown): EventoWebhook {
  const phoneNumberIds = new Set<string>();
  const mensagens: EventoWebhook['mensagens'] = [];

  const obj = payload as { entry?: Array<{ changes?: Array<{ value?: ValorWebhook }> }> };
  for (const entry of obj.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const valor = change.value;
      if (!valor) continue;
      const phoneNumberId = valor.metadata?.phone_number_id;
      if (!phoneNumberId) continue;
      phoneNumberIds.add(phoneNumberId);

      const contatos = new Map<string, string>();
      for (const contato of valor.contacts ?? []) {
        if (contato.wa_id && contato.profile?.name) {
          contatos.set(contato.wa_id, contato.profile.name);
        }
      }

      for (const m of valor.messages ?? []) {
        if (!m.id || !m.from) continue;
        const texto = extrairTexto(m);
        mensagens.push({
          externalId: m.id,
          phoneNumberId,
          remetenteTelefone: m.from,
          remetenteNome: contatos.get(m.from),
          texto,
          timestamp: m.timestamp
            ? new Date(Number(m.timestamp) * 1000)
            : new Date(),
        });
      }
    }
  }

  return { phoneNumberIds, mensagens };
}

interface ValorWebhook {
  metadata?: { phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: Array<{
    id?: string;
    from?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
    image?: { caption?: string };
    document?: { caption?: string; filename?: string };
  }>;
}

function extrairTexto(m: NonNullable<ValorWebhook['messages']>[number]): string {
  if (m.type === 'text' && m.text?.body) return m.text.body;
  if (m.type === 'image') return m.image?.caption ?? '[imagem recebida]';
  if (m.type === 'document') {
    return m.document?.caption ?? `[documento: ${m.document?.filename ?? 'sem nome'}]`;
  }
  return `[mensagem do tipo ${m.type ?? 'desconhecido'}]`;
}
