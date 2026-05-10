import { SetMetadata } from '@nestjs/common';

export const CHAVE_PAPEIS = 'papeis';

export const Papeis = (...papeis: string[]) => SetMetadata(CHAVE_PAPEIS, papeis);
