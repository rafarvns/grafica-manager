# Stage 1: Build
FROM node:20-slim AS builder

# Instala o pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copia arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copia os pacotes necessários
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Instala todas as dependências
RUN pnpm install --frozen-lockfile

# Build do pacote compartilhado
RUN pnpm --filter @grafica/shared build

# Build do backend
RUN pnpm --filter @grafica/backend build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

# Copia as configurações do workspace para o runtime
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copia os artefatos de build e package.json de cada pacote
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/package.json
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma

# Instala apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile

# Expõe a porta configurada
EXPOSE 3333

# Comando para rodar migrações e iniciar o servidor
CMD npx prisma migrate deploy && node packages/backend/dist/index.js
