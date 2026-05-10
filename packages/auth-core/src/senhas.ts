import argon2 from 'argon2';

const opcoes: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function gerarHashSenha(senha: string): Promise<string> {
  return argon2.hash(senha, opcoes);
}

export async function verificarSenha(hash: string, senha: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, senha, opcoes);
  } catch {
    return false;
  }
}
