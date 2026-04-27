# Gráfica Manager — Project Rules

Sistema desktop (Electron + React + Express + Prisma + MySQL) em monorepo pnpm para gerenciamento de gráfica. Estas regras são **vinculantes** — leia o `README.md` para contexto completo.

> Idioma: respostas, comentários no código (quando estritamente necessários), nomes de specs/ADRs e mensagens de commit em **português**. Identificadores de código (variáveis, funções, classes, arquivos) em **inglês**.

---

## 1. Stack obrigatória

| Camada     | Tecnologia                        | Não usar                                        |
| ---------- | --------------------------------- | ----------------------------------------------- |
| Frontend   | React + Electron                  | Next.js, Vue, Svelte                            |
| UI         | Componentes próprios + CSS Modules| MUI, Chakra, Ant, Tailwind, styled-components, emotion |
| Estado     | Context API + hooks               | Redux, Zustand, Recoil, MobX                    |
| Backend    | Node 20+ / TypeScript / Express   | Fastify, NestJS, Koa                            |
| ORM        | Prisma                            | TypeORM, Sequelize, Knex puro                   |
| Banco      | MySQL 8+                          | Postgres, SQLite (exceto em testes)             |
| Monorepo   | pnpm workspaces                   | npm, yarn, lerna, nx, turbo                     |
| Testes     | Vitest + Playwright               | Jest, Mocha, Cypress                            |
| Lint/format| ESLint + Prettier                 | tslint, standard                                |

**Nunca** adicione dependências fora desta lista sem antes registrar uma ADR em `sdd-docs/decisions/` justificando a escolha.

---

## 2. Restrição de performance (não-negociável)

**Alvo: PC com 4GB RAM, dual-core, Windows 10+.** Toda decisão técnica passa por este filtro.

- Pacotes pesados são proibidos. Antes de instalar qualquer dep, verifique tamanho/peso (bundlephobia ou similar).
- Frontend: lazy loading **em todas as páginas**, virtualização própria para listas longas (>100 itens), zero animação supérflua.
- Sem CSS-in-JS com runtime (emotion, styled-components). Use CSS Modules.
- Sem polling agressivo. Prefira eventos / IPC.
- Imagens e PDFs: streaming/chunking; jamais carregue inteiro em memória se evitável.

---

## 3. Estrutura do monorepo

```
packages/backend     — API Express (Clean Architecture)
packages/frontend    — Electron + React (renderer + main)
packages/shared      — Tipos, enums, validators compartilhados
sdd-docs/specs       — Specs de feature (SDD)
sdd-docs/api         — Contratos OpenAPI
sdd-docs/decisions   — ADRs
```

- Tipos de **domínio compartilhado** (DTOs trafegados frontend↔backend, enums de negócio) vivem em `packages/shared`.
- Tipos internos de cada package ficam dentro do próprio package.
- Nunca importe de `packages/backend` no frontend (ou vice-versa) — só via `packages/shared`.

---

## 4. Backend — Clean Architecture + DDD

### Camadas e regra de dependência

```
domain ← application ← infrastructure
                   ↖ interface (controllers/routes)
```

A seta indica direção das dependências. **Nunca inverta.**

| Camada         | Pasta                          | Pode importar de                  |
| -------------- | ------------------------------ | --------------------------------- |
| Domain         | `src/domain/`                  | nada externo (zero frameworks)    |
| Application    | `src/application/`             | `domain`                          |
| Infrastructure | `src/infrastructure/`          | `domain`, `application`           |
| Interface (HTTP)| `src/infrastructure/http/`    | `application` (use cases), `domain` (tipos) |

### Regras duras

- **Domain layer não conhece Express, Prisma, axios, fs ou qualquer lib de IO.** Se tentar `import` de framework dentro de `src/domain/`, está errado.
- **Repositories**: interface em `domain/repositories/`, implementação Prisma em `infrastructure/database/`.
- **Use Cases**: um arquivo por caso de uso, classe com método único `execute(input): Promise<output>`. SRP rigoroso.
- **DTOs e Validators** ficam em `application/`. Validação com Zod (preferido) ou similar leve.
- **Controllers** apenas: (1) extraem dados da request, (2) chamam use case, (3) formatam response. Zero lógica de negócio.
- **Eventos de domínio**: side-effects (log, notificação, contabilização) via Observer pattern, não inline em use cases.
- **Adaptadores** para integrações externas (Shopee, ML, impressora) implementam interfaces declaradas em `domain/`.

### Injeção de dependência

- Construtor recebe interfaces, não implementações concretas.
- Composition root (wiring) só em `infrastructure/config/` ou no entrypoint.
- Não use containers DI complexos (Inversify, tsyringe) — composição manual é suficiente para este escopo.

---

## 5. Frontend — leveza obrigatória

### Estrutura

```
src/
├── pages/        — telas, todas lazy
├── components/
│   ├── ui/       — primitivos (Button, Input, Modal, Table, Select…)
│   └── domain/   — componentes de domínio (PrintPreview, OrderCard…)
├── hooks/
├── contexts/
├── services/     — fetch wrapper para a API
├── types/
└── utils/        — funções puras
```

### Regras

- **Componentes UI são construídos do zero.** Nunca instale `@mui/*`, `antd`, `react-bootstrap`, `chakra-ui`, etc.
- **Acessibilidade**: todo primitivo UI deve ter foco visível, label semântica e suporte a teclado. Não negociável.
- **CSS Modules** (`*.module.css`). Evite estilos globais exceto reset/tokens.
- **Tokens de design** (cores, spacing, fontes) em CSS variables em um único arquivo.
- Camada `services/` é o **único** lugar que faz `fetch` para a API. Páginas/components consomem via hooks.
- Comunicação com main process do Electron exclusivamente via `preload.ts` (contextIsolation: true, nodeIntegration: false).

---

## 6. Spec Driven Development (SDD) + TDD

### Fluxo obrigatório para qualquer feature nova

1. **Spec** em `sdd-docs/specs/<numero>-<slug>.md` usando o template abaixo.
2. **Contrato de API** (se HTTP) em `sdd-docs/api/` (OpenAPI YAML).
3. **Testes que validam a spec** — escritos antes do código de produção (Red).
4. **Implementação mínima** para passar (Green).
5. **Refactor** mantendo testes verdes.
6. **ADR** em `sdd-docs/decisions/` se a implementação tomou decisão arquitetural relevante.

Pular etapas não é aceitável. Se o usuário pedir "implementa direto", lembre-o do fluxo SDD e pergunte se quer pular conscientemente.

### Template de spec

```markdown
# Feature: <nome>
## Contexto
## Requisitos Funcionais
## Requisitos Não-Funcionais
## Critérios de Aceite (Given/When/Then)
## API Contract (se aplicável — link para sdd-docs/api/...)
## Dependências
## Notas de Implementação
```

### ADRs

Formato: `NNNN-titulo-curto.md` com seções **Status**, **Contexto**, **Decisão**, **Consequências**.

---

## 7. Testes

| Tipo            | Ferramenta | Onde mora                          | Cobre                                      |
| --------------- | ---------- | ---------------------------------- | ------------------------------------------ |
| Unitário        | Vitest     | `tests/unit/` em cada package      | Entities, Value Objects, Use Cases, hooks  |
| Integração      | Vitest     | `tests/integration/` no backend    | Repositories+DB real, rotas HTTP           |
| E2E             | Playwright | `packages/frontend/tests/e2e/`     | Fluxos completos pela UI Electron          |

### Regras

- **Integração usa banco MySQL real** (container ou instância de teste), nunca SQLite/mock. Razão: divergência de dialeto Prisma já causou bugs em projetos similares.
- Mocks são para **dependências externas** (HTTP de terceiros, impressora física), não para o próprio código.
- Cada use case tem teste unitário; cada endpoint tem teste de integração; cada fluxo crítico tem teste E2E.
- Fixtures e factories em `tests/fixtures/`.
- Sem teste, sem merge.

---

## 8. Convenções de código

- **TypeScript estrito**: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- **Imports absolutos** via `paths` no tsconfig (ex.: `@/domain/...`). Nunca `../../../`.
- **Nomes**:
  - Classes/Types/Interfaces: `PascalCase`.
  - Variáveis/funções: `camelCase`.
  - Constantes globais: `UPPER_SNAKE_CASE`.
  - Arquivos: `kebab-case.ts` para módulos, `PascalCase.tsx` para componentes React.
- **Sem `any`.** Use `unknown` + narrowing quando o tipo for genuinamente desconhecido.
- **Comentários**: padrão é não escrever. Só comente o **porquê** quando não é óbvio (constraint oculta, bug específico, decisão contra-intuitiva).
- **Erros**: classes de erro de domínio em `domain/errors/`, traduzidas a HTTP status no controller. Nunca lance `Error` genérico no domínio.

---

## 9. Banco de dados (Prisma)

- Schema em `packages/backend/prisma/schema.prisma`.
- **Toda mudança de schema é uma migration** (`prisma migrate dev`). Nunca edite o banco direto.
- Migrations são versionadas no git e **imutáveis** após merge na main.
- Seeds em `prisma/seed.ts`, executados via `prisma db seed`.
- Ids: `String @id @default(uuid())` por padrão (cuid2 aceitável). Não use auto-increment para entidades de domínio.

---

## 10. Git, commits, PRs

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Mensagem de commit descreve o **porquê**, não o quê. Em português.
- PRs pequenos e focados. Um PR = uma feature/fix.
- Nunca commit em `main` direto após o setup inicial — sempre via PR.
- Nunca commit `.env`, credenciais, tokens, ou arquivos em `node_modules/`, `dist/`, `build/`.

---

## 11. Segurança

- **Webhooks**: validar assinatura HMAC antes de processar payload. Nunca confie em payload externo.
- **Tokens de e-commerce**: em `.env`, nunca em código. `.env.example` mantido atualizado.
- **Inputs do usuário**: validados por Zod antes de chegar ao use case.
- **SQL injection**: Prisma protege por default — não use `$queryRawUnsafe` sem revisão explícita.
- **Electron**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` quando viável. APIs nativas expostas só pelo `preload.ts` com lista mínima.

---

## 12. Antes de começar qualquer trabalho

1. A spec da feature existe em `sdd-docs/specs/`? Se não, escreva primeiro.
2. Os tipos compartilhados (DTOs, enums) precisam estar em `packages/shared`?
3. Em qual camada (domain/application/infrastructure) o código vive?
4. Os testes existem? Se não, escreva-os antes do código de produção.
5. Esta mudança quebra a regra de dependência da Clean Architecture? Se sim, repense.

Em caso de dúvida sobre decisão arquitetural, **pare e pergunte ao usuário** ao invés de improvisar.
