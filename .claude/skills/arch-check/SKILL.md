---
name: arch-check
description: Verifica a Clean Architecture do backend e a leveza do frontend — caça imports proibidos (domain importando express/prisma, application importando infrastructure, frontend importando libs de UI banidas, etc.). Use ANTES de cada PR e quando suspeitar de violação. Reporta lista de violações com arquivo:linha.
---

# arch-check

Auditoria estática contra as regras do CLAUDE.md. Não modifica código — só reporta.

## Checks obrigatórios

### Backend — regra de dependência

| Camada            | Não pode importar de                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `src/domain/**`   | `express`, `@prisma/client`, `axios`, `fs`, `node:fs`, `zod`, qualquer `infrastructure/*`, `application/*` |
| `src/application/**` | `express`, `@prisma/client`, qualquer `infrastructure/*`                               |
| `src/infrastructure/http/controllers/**` | `@prisma/client` direto (deve passar por use case → repository)        |

### Frontend — libs proibidas

Procurar em `packages/frontend/package.json` e `import` em `packages/frontend/src/**`:

- `@mui/*`, `@material-ui/*`
- `antd`
- `@chakra-ui/*`
- `react-bootstrap`, `bootstrap`
- `tailwindcss`
- `styled-components`
- `@emotion/*`
- `redux`, `@reduxjs/toolkit`, `zustand`, `recoil`, `mobx`
- `react-window`, `react-virtual`, `@tanstack/react-virtual` (virtualização deve ser própria)

### Cross-package

- `packages/frontend/src/**` não pode importar de `packages/backend/**`.
- `packages/backend/src/**` não pode importar de `packages/frontend/**`.
- Tipos compartilhados devem vir de `@grafica/shared`.

### Outros

- Nenhum arquivo TS com `any` explícito (ignore `as any` em testes? **não** — flagge tudo, decida caso a caso).
- Nenhum `console.log` em código de produção (`src/`). Logs via logger configurado.
- Migrations Prisma nunca editadas após primeiro commit (verificar `git log` da pasta `prisma/migrations/`).
- Electron `main.ts` deve ter `contextIsolation: true`, `nodeIntegration: false`.

## Como executar

Ferramentas: `Grep` para imports, `Read` para inspeção pontual, `Bash` para `git log` em migrations.

Sequência sugerida (em paralelo onde possível):

1. `Grep -n` por padrões de import proibido em cada camada.
2. `Read` `packages/frontend/package.json` e checar contra a lista de libs banidas.
3. `Grep` por `: any\b` e `as any\b` no código.
4. `Grep` por `console\.(log|error|warn)` em `packages/*/src/`.
5. `Read` `packages/frontend/electron/main.ts` para validar flags de segurança.
6. `Bash`: `git log --diff-filter=M --name-only -- 'packages/backend/prisma/migrations/'` — qualquer migration modificada após criação é violação.

## Output esperado

Relatório curto, agrupado por categoria. Para cada violação:

```
[CATEGORIA] arquivo:linha — descrição da violação
  → como corrigir
```

Exemplo:
```
[DOMAIN-DEP] packages/backend/src/domain/entities/Order.ts:3 — importa de '@prisma/client'
  → mover persistência para PrismaOrderRepository; entity recebe tipos puros

[FRONTEND-LIB] packages/frontend/package.json — dependência proibida: @mui/material
  → remover; substituir uso por componentes próprios em components/ui/
```

Se zero violações: reportar **PASSOU** com contagem de arquivos auditados por categoria.

## Não faça

- Não modifique código aqui — apenas reporte.
- Não ignore `any` em testes sem perguntar — testes devem ser tipados também.
- Não rode esta skill silenciosamente se for chamada antes de PR — sempre mostre o relatório completo.
