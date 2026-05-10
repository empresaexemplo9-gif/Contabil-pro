import { PrismaClient, PapelUsuario, PlanoEscritorio, RegimeTributario } from '@prisma/client';

const prisma = new PrismaClient();

async function principal() {
  console.log('🌱 Semeando banco de dados...');

  const escritorio = await prisma.escritorio.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      razaoSocial: 'Escritório Demo Contabilidade Ltda',
      nomeFantasia: 'Demo Contábil',
      plano: PlanoEscritorio.PRO,
    },
  });

  const proprietario = await prisma.usuario.upsert({
    where: { email: 'admin@contabilpro.local' },
    update: {},
    create: {
      email: 'admin@contabilpro.local',
      nome: 'Administrador Demo',
      // hash Argon2id da senha "ContabilPro@2025" — gerar real via auth-core em produção
      senhaHash: '$argon2id$v=19$m=65536,t=3,p=4$placeholder$trocar-em-producao',
      status: 'ATIVO',
      emailVerificado: true,
    },
  });

  await prisma.vinculoUsuario.upsert({
    where: {
      usuarioId_escritorioId: {
        usuarioId: proprietario.id,
        escritorioId: escritorio.id,
      },
    },
    update: {},
    create: {
      usuarioId: proprietario.id,
      escritorioId: escritorio.id,
      papel: PapelUsuario.PROPRIETARIO,
    },
  });

  await prisma.empresa.upsert({
    where: {
      escritorioId_cnpj: {
        escritorioId: escritorio.id,
        cnpj: '00.000.000/0001-00',
      },
    },
    update: {},
    create: {
      escritorioId: escritorio.id,
      cnpj: '00.000.000/0001-00',
      razaoSocial: 'Cliente Exemplo Ltda',
      nomeFantasia: 'Cliente Exemplo',
      regime: RegimeTributario.SIMPLES_NACIONAL,
    },
  });

  console.log('✅ Banco semeado com sucesso.');
  console.log('   Escritório:', escritorio.slug);
  console.log('   Usuário admin:', proprietario.email);
}

principal()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
