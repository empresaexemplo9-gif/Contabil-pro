import { SignJWT, jwtVerify, importPKCS8, importSPKI, type KeyLike } from 'jose';

const ALG = 'RS256';

export interface PayloadAcesso {
  sub: string;
  escritorioId: string;
  papel: string;
  permissoes?: string[];
}

let chavePrivada: KeyLike | null = null;
let chavePublica: KeyLike | null = null;

async function obterChavePrivada(pem: string): Promise<KeyLike> {
  if (!chavePrivada) chavePrivada = await importPKCS8(pem, ALG);
  return chavePrivada;
}

async function obterChavePublica(pem: string): Promise<KeyLike> {
  if (!chavePublica) chavePublica = await importSPKI(pem, ALG);
  return chavePublica;
}

export async function emitirTokenAcesso(
  payload: PayloadAcesso,
  pemPrivada: string,
  ttlSegundos: number,
): Promise<string> {
  const chave = await obterChavePrivada(pemPrivada);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${ttlSegundos}s`)
    .setIssuer('contabilpro')
    .setAudience('contabilpro-api')
    .sign(chave);
}

export async function verificarTokenAcesso(
  token: string,
  pemPublica: string,
): Promise<PayloadAcesso & { iat: number; exp: number }> {
  const chave = await obterChavePublica(pemPublica);
  const { payload } = await jwtVerify(token, chave, {
    algorithms: [ALG],
    issuer: 'contabilpro',
    audience: 'contabilpro-api',
  });
  return payload as unknown as PayloadAcesso & { iat: number; exp: number };
}
