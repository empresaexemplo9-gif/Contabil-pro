import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function principal() {
  const caminho = join(__dirname, 'sql', 'habilitar-rls.sql');
  const sql = readFileSync(caminho, 'utf8');
  console.log('⏳ Aplicando políticas de Row-Level Security...');
  await prisma.$executeRawUnsafe(sql);
  console.log('✅ RLS habilitado em todas as tabelas tenant-scoped.');
}

principal()
  .catch((erro) => {
    console.error('❌ Falha ao aplicar RLS:', erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
