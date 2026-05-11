/**
 * Cliente mínimo para a API da ZapSign usado pelo worker.
 * Documentação: https://docs.zapsign.com.br/
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

export interface DocumentoCriado {
  externalId: string;
  status: string;
  signatarios: Array<{ token: string; email: string; nome: string }>;
}

export async function criarDocumento(
  credenciais: CredenciaisZapsign,
  dados: {
    nome: string;
    urlPdf: string;
    signatarios: SignatarioEntrada[];
    dataLimite?: string;
  },
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
  if (!externalId) throw new Error('Resposta ZapSign sem token');
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
