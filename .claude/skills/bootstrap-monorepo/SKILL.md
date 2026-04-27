---
name: bootstrap-monorepo
description: Inicializa o monorepo do Gráfica Manager do zero — pnpm-workspace.yaml, packages/{backend,frontend,shared}, tsconfig.base.json, ESLint/Prettier, scripts raiz. Use APENAS na primeira configuração ou se o monorepo estiver corrompido. Não use se packages/ já existir com conteúdo.
---

# bootstrap-monorepo

Operação one-shot que monta a estrutura inicial do monorepo conforme `CLAUDE.md`.

## Pré-checagem (obrigatória)

Antes de qualquer escrita:
1. `ls packages/` — se já existe e tem conteúdo, **pare** e pergunte ao usuário se quer sobrescrever.
2. Confira Node ≥ 20 e pnpm ≥ 9 (`node -v`, `pnpm -v`).

## O que criar

### Raiz
- `pnpm-workspace.yaml` declarando `packages/*`.
- `package.json` raiz com scripts: `dev`, `test`, `test:unit`, `test:integration`, `test:e2e`, `lint`, `build`.
- `tsconfig.base.json` com `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, paths para `@shared/*`.
- `.eslintrc.cjs` e `.prettierrc` na raiz.
- `.editorconfig`.
- Atualizar `.gitignore` (já existe — somar entradas: `coverage/`, `*.tsbuildinfo`, `.turbo/`, `playwright-report/`).
- `.env.example` com variáveis de DB e tokens de e-commerce stubadas.

### packages/shared
- `package.json` (`@grafica/shared`), `tsconfig.json` (extends base), `src/index.ts`, `src/types/`, `src/constants/`, `src/validators/`.

### packages/backend
- `package.json` (`@grafica/backend`) com deps: `express`, `zod`, `@prisma/client`, `dotenv`. devDeps: `prisma`, `vitest`, `tsx`, `@types/express`, `@types/node`.
- `tsconfig.json` com paths `@/*` → `src/*`.
- Scaffold de pastas: `src/{domain/{entities,value-objects,events,repositories,services,errors},application/{use-cases,dtos,validators},infrastructure/{database,http/{controllers,routes,middlewares},adapters,config},shared}`.
- `prisma/schema.prisma` com `provider = "mysql"` e datasource via `env("DATABASE_URL")`.
- `tests/{unit,integration,fixtures}` vazios com `.gitkeep`.
- `src/index.ts` com bootstrap mínimo do Express.

### packages/frontend
- `package.json` (`@grafica/frontend`) com deps: `react`, `react-dom`, `electron`. devDeps: `vite`, `@vitejs/plugin-react`, `vitest`, `@playwright/test`, `electron-builder`, `typescript`, `@types/react`, `@types/react-dom`.
- `tsconfig.json` (paths `@/*`), `vite.config.ts`, `index.html`.
- `electron/{main.ts,preload.ts,ipc/}` — main com `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- `src/{pages,components/{ui,domain},hooks,contexts,services,types,utils}` com `.gitkeep`.
- `src/main.tsx`, `src/App.tsx`, `src/index.css` (CSS variables: tokens de cor/spacing).
- `tests/{unit,e2e}/` com `.gitkeep`.

## Após gerar

1. Rodar `pnpm install` para validar.
2. Rodar `pnpm tsc --noEmit -p packages/backend` e idem frontend para validar tsconfigs.
3. Reportar ao usuário: estrutura criada, próximo passo sugerido (`new-spec` para a primeira feature).

## Regras

- **Nunca** instalar libs proibidas pelo CLAUDE.md (MUI, Tailwind, Redux, etc.).
- Versões pinadas em `^` para majors estáveis.
- Não criar README dentro de cada package — o README raiz já cobre.
- Não inicializar git (já está inicializado).
