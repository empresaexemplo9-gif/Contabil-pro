/**
 * Adapter para a API da ZapSign (assinatura eletrônica brasileira).
 * Documentação: https://docs.zapsign.com.br/
 *
 * Modelo: criamos um documento a partir de uma URL pública (presignada S3)
 * e listamos os signatários. A ZapSign envia e-mail/SMS aos signatários
 * e dispara webhooks à medida que assinam.
 */

const URL_BASE = 'https://api.zapsign.com.br';

export interface CredenciaisZapsign {
  apiToken: string;
}

export interface SignatarioEntrada {
  nome: string;
  email: string;
  cpf?: string;
}

export interface CriarDocumentoEntrada {
  nome: string;
  urlPdf: string;
  signatarios: SignatarioEntrada[];
  /** Data limite ISO 8601 para conclusão (opcional). */
  dataLimite?: string;
}

export interface DocumentoCriado {
  externalId: string;
  signatarios: Array<{ token: string; email: string; nome: string }>;
  status: string;
}

export async function criarDocumento(
  credenciais: CredenciaisZapsign,
  dados: CriarDocumentoEntrada,
): Promise<DocumentoCriado> {
  const corpo = {
    name: dados.nome,
    url_pdf: dados.urlPdf,
    signers: dados.signatarios.map((s) => ({
      name: s.nome,
      email: s.email,
      ...(s.cpf ? { auth_mode: 'assinaturaTela-tokenEmail', cpf: s.cpf } : {}),
    })),
    ...(dados.dataLimite ? { date_limit_to_sign: dados.dataLimite } : {}),
    lang: 'pt-br',
  };

  const resposta = await fetch(`${URL_BASE}/api/v1/docs/?api_token=${credenciais.apiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha ao criar documento ZapSign (HTTP ${resposta.status}): ${erro}`);
  }

  const dadosResp = (await resposta.json()) as {
    open_id?: string;
    token?: string;
    status?: string;
    signers?: Array<{ token: string; email: string; name: string }>;
  };
  const externalId = dadosResp.token ?? dadosResp.open_id;
  if (!externalId) throw new Error('Resposta ZapSign sem token/open_id');
  return {
    externalId,
    status: dadosResp.status ?? 'pending',
    signatarios: (dadosResp.signers ?? []).map((s) => ({
      token: s.token,
      email: s.email,
      nome: s.name,
    })),
  };
}

export interface EventoWebhookZapsign {
  /** Token do documento no ZapSign. */
  documentoExternalId: string;
  /** Email/token do signatário se evento for específico de um signatário. */
  signatarioEmail?: string;
  signatarioStatus?: 'ASSINADO' | 'RECUSADO';
  documentoStatus?: 'PARCIAL' | 'CONCLUIDA' | 'EXPIRADA' | 'CANCELADA';
}

const MAP_STATUS_DOC: Record<string, EventoWebhookZapsign['documentoStatus']> = {
  signed: 'CONCLUIDA',
  refused: 'CANCELADA',
  expired: 'EXPIRADA',
  pending: 'PARCIAL',
};

/**
 * Normaliza o evento de webhook do ZapSign em uma estrutura agnóstica do
 * provedor para que o serviço atualize signatários/solicitação no banco.
 *
 * Formato esperado (resumido): { event_type, doc: { token, status }, signer? }
 */
export function parsearWebhookZapsign(payload: unknown): EventoWebhookZapsign | null {
  const obj = payload as {
    event_type?: string;
    doc?: { token?: string; open_id?: string; status?: string };
    signer?: { email?: string; status?: string };
  };

  const externalId = obj.doc?.token ?? obj.doc?.open_id;
  if (!externalId) return null;

  const evento: EventoWebhookZapsign = { documentoExternalId: externalId };

  if (obj.doc?.status && MAP_STATUS_DOC[obj.doc.status]) {
    evento.documentoStatus = MAP_STATUS_DOC[obj.doc.status];
  }

  if (obj.signer?.email) {
    evento.signatarioEmail = obj.signer.email;
    if (obj.signer.status === 'signed') evento.signatarioStatus = 'ASSINADO';
    else if (obj.signer.status === 'refused') evento.signatarioStatus = 'RECUSADO';
  }

  return evento;
}
