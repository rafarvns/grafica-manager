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

# Build do pacote compartilhado
RUN pnpm --filter @grafica/shared build

# Build do backend e resolução de aliases (@/)
RUN pnpm --filter @grafica/backend build && \
    cd packages/backend && npx tsc-alias -p tsconfig.json

# Stage 2: Runtime
FROM node:22-slim

# Instala dependências necessárias para o Prisma (OpenSSL)
RUN apt-get update -y && apt-get install -y openssl && \
    npm install -g pnpm

WORKDIR /app

# Copia as configurações do workspace para o runtime
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./

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
# Usamos prisma@5 para manter compatibilidade com o schema atual e evitar o erro da v7
CMD ["sh", "-c", "npx prisma@5 migrate deploy --schema ./packages/backend/prisma/schema.prisma && node packages/backend/dist/index.js"]
