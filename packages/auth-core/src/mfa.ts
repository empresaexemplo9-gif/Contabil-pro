import { authenticator } from 'otplib';

authenticator.options = {
  step: 30,
  window: 1,
  digits: 6,
};

export function gerarSegredoMfa(): string {
  return authenticator.generateSecret();
}

export function gerarUriMfa(emissor: string, conta: string, segredo: string): string {
  return authenticator.keyuri(conta, emissor, segredo);
}

export function validarCodigoMfa(codigo: string, segredo: string): boolean {
  return authenticator.verify({ token: codigo, secret: segredo });
}
