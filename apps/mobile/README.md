# ViajeBrasil — App Mobile

Aplicativo mobile da **ViajeBrasil** (VIAJE BRASIL LTDA) para venda de
passagens **rodoviárias** e **aéreas** (nacionais e internacionais),
**hospedagem**, **locação de veículos**, **seguro viagem** e **pacotes
turísticos**. Slogan: _Realizando Sonhos_.

Construído com **Expo + React Native + Expo Router + TypeScript**. A interface
da tela inicial (carrossel de ofertas, seletor de categorias e busca) tem como
referência o app da Decolar.

> Projeto **autônomo**: tem seu próprio gerenciamento de dependências (npm) e
> roda isolado. Mora no repositório `viajebrasil` e é espelhado em
> `apps/mobile` do monorepo `contabil-pro` (onde fica fora do workspace pnpm,
> para não interferir no `pnpm install --frozen-lockfile` da API/web).

## Como rodar

A partir da raiz do projeto:

```bash
npm install
npm start          # abre o Expo Dev Tools (QR code)
npm run android    # emulador/dispositivo Android
npm run ios        # simulador iOS (macOS)
npm run web        # versão web
```

## Verificações

```bash
npm run type-check          # tsc --noEmit
npx expo export --platform web   # valida que todas as rotas compilam
```

## Estrutura

```
app/                 Rotas (Expo Router)
  (tabs)/            Abas: Início, Buscar, Reservas, Perfil
  resultados.tsx     Lista de resultados por categoria
  detalhe.tsx        Detalhe do produto + adicionar à reserva
  checkout.tsx       Pagamento (PIX, cartão, boleto) + confirmação
  login.tsx          Login (e-mail/senha e Google)
  sobre.tsx          Segurança, formas de pagamento, canais e dados da empresa
  termos.tsx         Termos de Uso completos
src/
  componentes/       UI reutilizável (logo, carrossel, cartões, botões...)
  contextos/         Carrinho de reservas e autenticação (React Context)
  dados/             Dados mockados (passagens, hotéis, pacotes, etc.)
  i18n/              Strings de UI em PT-BR (sem texto hardcoded nas telas)
  tema/              Cores da marca, tipografia, espaçamento
  tipos/             Tipos TypeScript dos produtos
assets/              Ícone e splash (gerados por scripts/gerar_assets.py)
```

## Convenções

Segue o `CLAUDE.md` da raiz: identificadores em PT-BR sem acento, comentários
em português, e **toda string de UI passa pelo i18n** (`src/i18n`).

## Observações

- Os dados são **mockados** (`src/dados`). A integração real seria feita com a
  API de parceiros (ex.: PassHub) e gateways de pagamento.
- As imagens ilustrativas vêm do Unsplash (exigem rede para carregar).
- O ícone/splash são gerados sem dependências externas:
  `python3 scripts/gerar_assets.py`.

## Deploy web (Vercel)

O app roda também na web (Expo Router com `output: "static"`). O `vercel.json`
já está configurado para gerar o site estático em `dist/`.

Para publicar um preview compartilhável:

1. Na Vercel, **New Project** apontando para este repositório.
2. Em **Root Directory**, selecione `apps/mobile`.
3. O build usa `npm run build:web` (= `expo export --platform web`) e publica
   a pasta `dist`. Não precisa de variáveis de ambiente para a versão mockada.
4. Quando os endpoints reais existirem, defina `EXPO_PUBLIC_API_URL` nas
   Environment Variables do projeto — os serviços passam de `mock` para `api`
   automaticamente (ver `src/servicos/config.ts`).

> É um projeto Vercel **separado** do app web contábil (`contabil-pro-*`); não
> compartilham build nem domínio.

Build local para conferir:

```bash
npm run build:web   # gera dist/
npx serve dist      # serve estático em http://localhost:3000
```
