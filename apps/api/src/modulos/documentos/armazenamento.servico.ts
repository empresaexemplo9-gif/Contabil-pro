import { randomBytes } from 'node:crypto';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { del, put } from '@vercel/blob';

import { configurarEnv } from '../../config/env';

/**
 * Encapsula o Vercel Blob (substitui o cliente S3 que existia antes).
 *
 * Diferenças importantes em relação ao S3:
 * - **Sem presigned PUT URL**: o cliente envia multipart pra API e a API
 *   chama `put()`. Limitação: corpo de função Vercel é 4.5 MB por padrão.
 *   Pra arquivos maiores, use streaming + Fluid Compute (Pro).
 * - **Download direto**: a URL retornada por `put()` é estável e pública.
 *   Não há TTL — a URL contém um hash aleatório que serve de "token".
 *   Mantenha-a privada (não vaze em logs/responses inadvertidos).
 */
@Injectable()
export class ArmazenamentoServico {
  private readonly habilitado: boolean;

  constructor() {
    const env = configurarEnv();
    this.habilitado = !!env.BLOB_READ_WRITE_TOKEN;
  }

  private exigirHabilitado(): void {
    if (!this.habilitado) {
      throw new ServiceUnavailableException(
        'Armazenamento não configurado. Defina BLOB_READ_WRITE_TOKEN.',
      );
    }
  }

  gerarChave(escritorioId: string, nomeArquivo: string): string {
    const sufixo = randomBytes(8).toString('hex');
    const limpo = nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ano = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    return `${escritorioId}/${ano}/${mes}/${sufixo}-${limpo}`;
  }

  /**
   * Faz upload do arquivo direto pro Vercel Blob e devolve a URL pública
   * (com hash) e a chave lógica usada como identificador interno.
   */
  async upload(
    escritorioId: string,
    arquivo: { buffer: Buffer; mimetype: string; originalname: string },
  ): Promise<{ url: string; chave: string }> {
    this.exigirHabilitado();
    const chave = this.gerarChave(escritorioId, arquivo.originalname);
    const blob = await put(chave, arquivo.buffer, {
      access: 'public',
      contentType: arquivo.mimetype,
      // addRandomSuffix false: usamos o sufixo determinístico de gerarChave
      addRandomSuffix: false,
    });
    return { url: blob.url, chave };
  }

  /**
   * Para Vercel Blob, "URL de download" = URL pública estável do blob.
   * Como armazenamos a chave (não a URL), reconstruímos via convenção:
   * todas as URLs começam com `https://<account>.public.blob.vercel-storage.com/`.
   *
   * O `BLOB_PUBLIC_URL` (preencher na env) tem esse prefixo, sem trailing slash.
   * Se não estiver definido, levanta erro pra evitar montar URL inválida.
   */
  async gerarUrlDownload(chave: string): Promise<string> {
    this.exigirHabilitado();
    const env = configurarEnv();
    if (!env.BLOB_PUBLIC_URL) {
      throw new ServiceUnavailableException(
        'BLOB_PUBLIC_URL não definida — copie da aba Storage do Vercel.',
      );
    }
    return `${env.BLOB_PUBLIC_URL.replace(/\/$/, '')}/${chave}`;
  }

  async remover(chave: string): Promise<void> {
    this.exigirHabilitado();
    const url = await this.gerarUrlDownload(chave);
    await del(url);
  }
}
