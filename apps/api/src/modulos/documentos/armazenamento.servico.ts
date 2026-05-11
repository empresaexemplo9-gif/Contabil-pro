import { randomBytes } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { configurarEnv } from '../../config/env';

const TTL_PRESIGN_SEGUNDOS = 600;

@Injectable()
export class ArmazenamentoServico {
  private readonly cliente: S3Client;
  private readonly bucket: string;

  constructor() {
    const env = configurarEnv();
    this.bucket = env.S3_BUCKET;
    this.cliente = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    });
  }

  gerarChave(escritorioId: string, nomeArquivo: string): string {
    const sufixo = randomBytes(8).toString('hex');
    const limpo = nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ano = new Date().getFullYear();
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    return `${escritorioId}/${ano}/${mes}/${sufixo}-${limpo}`;
  }

  async gerarUrlUpload(
    escritorioId: string,
    dados: { nome: string; mimeType: string; tamanhoBytes: number },
  ): Promise<{ url: string; chave: string; expiraEm: number }> {
    const chave = this.gerarChave(escritorioId, dados.nome);
    const comando = new PutObjectCommand({
      Bucket: this.bucket,
      Key: chave,
      ContentType: dados.mimeType,
      ContentLength: dados.tamanhoBytes,
    });
    const url = await getSignedUrl(this.cliente, comando, { expiresIn: TTL_PRESIGN_SEGUNDOS });
    return { url, chave, expiraEm: TTL_PRESIGN_SEGUNDOS };
  }

  async gerarUrlDownload(chave: string): Promise<string> {
    const comando = new GetObjectCommand({ Bucket: this.bucket, Key: chave });
    return getSignedUrl(this.cliente, comando, { expiresIn: TTL_PRESIGN_SEGUNDOS });
  }
}
