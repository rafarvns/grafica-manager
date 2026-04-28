# Feature: Estrutura Base do Backend

> Status: `implemented` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Estabelecer a fundação do servidor Express — conexão com MySQL via Prisma, roteamento da API, autenticação por token fixo (definido em env) para o frontend, leitura de variáveis de ambiente em cache na inicialização e suíte de testes unitários — sem a qual nenhuma outra feature pode ser desenvolvida.

## Requisitos Funcionais

- [x] RF1 — O servidor Express deve iniciar na porta definida em `PORT` (`.env`), respondendo com `200` em `GET /health`.
- [x] RF2 — A conexão com o banco MySQL via Prisma deve ser estabelecida na inicialização; falha de conexão deve encerrar o processo com log de erro.
- [x] RF3 — Todas as variáveis de ambiente obrigatórias (`DATABASE_URL`, `API_TOKEN`, `PORT`) devem ser lidas, validadas e cacheadas uma única vez ao iniciar (usando Zod ou similar).
- [x] RF4 — O sistema de rotas deve registrar um prefixo `/api/v1` e suportar versionamento futuro sem reescrita de rotas existentes.
- [x] RF5 — Um middleware de autenticação deve proteger todas as rotas sob `/api/v1`, comparando o header `Authorization: Bearer <token>` com o valor de `API_TOKEN` lido da env.
- [x] RF6 — A única rota pública (sem autenticação) é `GET /health`.
- [x] RF7 — Erros de autenticação (token ausente ou incorreto) devem retornar `401` com body `{ "error": "string" }`.
- [x] RF8 — Suíte de testes unitários cobrindo: validação de env vars, middleware de autenticação.

## Requisitos Não-Funcionais

- [x] RNF1 — (performance) Inicialização completa (boot + conexão DB) deve ocorrer em < 3 s em PC com 4 GB RAM / dual-core; variáveis de ambiente não devem ser relidas a cada request.
- [x] RNF2 — (segurança) `API_TOKEN` com no mínimo 32 caracteres; validação rejeitada na inicialização se abaixo do mínimo. Comparação de token deve usar comparação em tempo constante (`timingSafeEqual`) para evitar timing attacks.
- [x] RNF3 — (resiliência) Falha de conexão ao banco na inicialização deve logar a causa raiz e fazer `process.exit(1)`; não deve tentar servir requests sem DB.
- [x] RNF4 — (manutenibilidade) Zero `any` no TypeScript; `strict: true` habilitado; imports absolutos via `@/`.

## Critérios de Aceite

### Cenário 1: Boot bem-sucedido
- **Given** `.env` contém `DATABASE_URL`, `API_TOKEN` (≥ 32 chars) e `PORT` válidos
- **When** o servidor é iniciado com `pnpm dev` (ou `node dist/index.js`)
- **Then** o processo sobe sem erro, loga "Servidor ouvindo na porta X" e responde `200` em `GET /health`

### Cenário 2: Variável de ambiente ausente ou inválida
- **Given** `API_TOKEN` está ausente ou possui menos de 32 caracteres no `.env`
- **When** o servidor tenta iniciar
- **Then** o processo termina imediatamente com `process.exit(1)` e uma mensagem clara de qual variável está inválida

### Cenário 3: Banco inacessível
- **Given** `DATABASE_URL` aponta para um MySQL fora do ar
- **When** o servidor tenta conectar ao banco na inicialização
- **Then** o processo termina com `process.exit(1)` logando o erro de conexão

### Cenário 4: Request autenticada com sucesso
- **Given** o cliente envia `Authorization: Bearer <valor-de-API_TOKEN>` correto
- **When** o cliente faz `GET /api/v1/<rota-protegida>`
- **Then** a resposta é `200` (ou o status da rota) e não `401`

### Cenário 5: Request sem token
- **Given** o cliente não envia o header `Authorization`
- **When** o cliente faz `GET /api/v1/<rota-protegida>`
- **Then** a resposta é `401 { "error": "Token não informado" }`

### Cenário 6: Token incorreto
- **Given** o cliente envia um token diferente do valor de `API_TOKEN`
- **When** o cliente faz qualquer request a uma rota protegida
- **Then** a resposta é `401 { "error": "Token inválido" }`

## API Contract

Rotas expostas nesta spec:

```
GET  /health   — público — { status: "ok", uptime: number }
```

Não há endpoint de login. O token é gerado externamente (ex.: `openssl rand -hex 32`) e configurado em `.env`.

## Dependências

- Specs relacionadas: nenhuma (esta é a base; outras specs dependem dela)
- Pacotes/serviços externos:
  - `express` — já previsto na stack
  - `zod` — validação de env vars (já previsto)
  - `prisma` / `@prisma/client` — já previsto
- ADRs relevantes: nenhum pendente (sem bibliotecas novas a adicionar)

## Notas de Implementação

- Camadas afetadas: `infrastructure/config/` (env cache), `infrastructure/http/` (server, router, middleware), `domain/errors/` (`AuthError`)
- Arquivo de wiring/composition root: `packages/backend/src/main.ts`
- Env vars lidas **uma vez** via módulo `src/infrastructure/config/env.ts` exportando objeto tipado e imutável; demais módulos importam deste módulo, nunca de `process.env` diretamente.
- Middleware de autenticação em `src/infrastructure/http/middlewares/auth.middleware.ts`; usa `crypto.timingSafeEqual` para comparar o token recebido com `API_TOKEN`.
- Rotas públicas declaradas por lista explícita (`PUBLIC_ROUTES`) para evitar opt-out acidental.
- Testes esperados:
  - **Unitários** (`tests/unit/`): `env.spec.ts`, `auth.middleware.spec.ts`
  - **Integração** (`tests/integration/`): `health.route.spec.ts`, `protected.route.spec.ts`
- Riscos:
  - Prisma cold-start em dual-core pode ser lento; medir tempo de `$connect()` e logar.
  - Token fixo não expira — rotação exige redeploy; documentar isso no `.env.example`.
