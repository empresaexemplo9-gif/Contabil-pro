# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat tini
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV PNPM_HOME=/pnpm-store
RUN pnpm config set store-dir $PNPM_HOME

FROM base AS prune
COPY . .
RUN pnpm dlx turbo@2.1.3 prune @contabilpro/worker --docker

FROM base AS deps
COPY --from=prune /app/out/json/ ./
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app ./
COPY --from=prune /app/out/full/ ./
RUN pnpm --filter @contabilpro/database prisma generate
RUN pnpm --filter @contabilpro/worker build
RUN pnpm --filter @contabilpro/worker --prod deploy /export

FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /export ./
USER app
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
