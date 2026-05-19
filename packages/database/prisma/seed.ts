import { gerarHashSenha } from '@contabilpro/auth-core';
import { PapelUsuario, PlanoEscritorio, PrismaClient, RegimeTributario } from '@prisma/client';

const prisma = new PrismaClient();

interface UsuarioSeed {
  email: string;
  nome: string;
  senha: string;
  papel: PapelUsuario;
}

const ESCRITORIO_SLUG = 'demo';

/**
 * Usuários iniciais do escritório-demo.
 *
 * A senha em texto plano é usada APENAS no momento da semeadura para gerar
 * o hash Argon2id — o valor não é persistido, só o hash. Mesmo assim,
 * cada usuário deve trocar a senha no primeiro acesso (configurações →
 * redefinir senha) para que o segredo não fique acessível em código.
 *
 * Não há cadastro público no produto: novas contas só são criadas por
 * usuários PROPRIETARIO/ADMIN via UsuariosControlador.criar.
 */
const USUARIOS: UsuarioSeed[] = [
  {
    email: 'thiagohccarvalho00@gmail.com',
    nome: 'Thiago Carvalho',
    senha: '147532159St@',
    papel: PapelUsuario.ADMIN,
  },
  {
    email: 'empresaexemplo9@gmail.com',
    nome: 'Empresa Exemplo',
    senha: '147532159St@',
    papel: PapelUsuario.ADMIN,
  },
];

async function principal() {
  console.log('🌱 Semeando banco de dados…');

  const escritorio = await prisma.escritorio.upsert({
    where: { slug: ESCRITORIO_SLUG },
    update: {},
    create: {
      slug: ESCRITORIO_SLUG,
      razaoSocial: 'Escritório Demo Contabilidade Ltda',
      nomeFantasia: 'Demo Contábil',
      plano: PlanoEscritorio.PRO,
    },
  });

  for (const dados of USUARIOS) {
    const senhaHash = await gerarHashSenha(dados.senha);
    const usuario = await prisma.usuario.upsert({
      where: { email: dados.email },
      update: {
        nome: dados.nome,
        senhaHash,
        status: 'ATIVO',
        emailVerificado: true,
      },
      create: {
        email: dados.email,
        nome: dados.nome,
        senhaHash,
        status: 'ATIVO',
        emailVerificado: true,
      },
    });

    await prisma.vinculoUsuario.upsert({
      where: {
        usuarioId_escritorioId: {
          usuarioId: usuario.id,
          escritorioId: escritorio.id,
        },
      },
      update: { papel: dados.papel },
      create: {
        usuarioId: usuario.id,
        escritorioId: escritorio.id,
        papel: dados.papel,
      },
    });

    console.log(`   👤 ${dados.papel.padEnd(12)} ${dados.email}`);
  }

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
  console.log(`   Escritório: ${escritorio.slug}`);
  console.log(`   Usuários:   ${USUARIOS.length}`);
  console.log('   ⚠️  Troque a senha no primeiro login.');
}

principal()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
