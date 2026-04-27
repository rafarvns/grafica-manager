# Stage 1: Build
FROM node:22-slim AS builder

# Instala o pnpm e dependências do sistema
RUN apt-get update -y && apt-get install -y openssl && \
    npm install -g pnpm

WORKDIR /app

# Copia arquivos de configuração do workspace e o base tsconfig
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copia os pacotes necessários
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Instala todas as dependências
RUN pnpm install --frozen-lockfile

# Gerar o Prisma Client no build
RUN npx prisma@5 generate --schema ./packages/backend/prisma/schema.prisma

# Build dos pacotes (para typecheck e garantir integridade)
RUN pnpm --filter @grafica/shared build
RUN pnpm --filter @grafica/backend build

# Stage 2: Runtime
FROM node:22-slim

# Instala dependências necessárias (OpenSSL para o Prisma e pnpm)
RUN apt-get update -y && apt-get install -y openssl && \
    npm install -g pnpm

WORKDIR /app

# Copia as configurações e dependências
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copia o código fonte e prisma (necessário para rodar com tsx e migrações)
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/backend ./packages/backend

# Expõe a porta configurada
EXPOSE 3333

# Comando para rodar migrações e iniciar o servidor
# Usamos pnpm exec para garantir que o tsx local do monorepo seja encontrado
CMD ["sh", "-c", "pnpm --filter @grafica/backend exec prisma migrate deploy --schema prisma/schema.prisma && pnpm --filter @grafica/backend exec tsx src/index.ts"]
