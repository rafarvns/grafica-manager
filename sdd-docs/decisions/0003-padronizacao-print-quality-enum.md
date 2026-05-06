# ADR 0003: Padronização de PrintQuality em enum único

**Status:** Accepted
**Date:** 2026-05-05
**Author:** rafarvns
**Context Specs:** 0032 (Print Quality Fix), 0007 (Print Parameters Configuration), 0008 (Print Recording Accounting)

---

## Contexto

Investigação do bug de qualidade de impressão (spec 0032) revelou que `PrintQuality` está definido em três lugares com formatos diferentes:

1. **`packages/shared/src/constants/index.ts:13-17`** — enum `PrintQuality { DRAFT, NORMAL, HIGH }` (inglês)
2. **`packages/shared/src/types/settings.ts:4`** — type literal `'rascunho' | 'padrão' | 'premium'` (PT-BR variante 1)
3. **`packages/frontend/src/components/domain/PrintConfigPanel.tsx:5`** — type literal `'rascunho' | 'normal' | 'alta'` (PT-BR variante 2)

O backend (`print-jobs.routes.ts:130-134`) mantém um `qualityMap` que traduz `'rascunho'|'normal'|'alta'` para `DRAFT|NORMAL|HIGH` antes de persistir. Custos do estado atual:

- Tradução acoplada à rota — qualquer endpoint novo precisa replicar o mapa.
- Risco de divergência (variante "padrão" vs "normal", "premium" vs "alta") gera bugs silenciosos.
- Identificadores em PT-BR violam a regra do CLAUDE.md ("identificadores de código em inglês").

**Três opções consideradas:**

### Opção A: Enum em inglês `DRAFT|NORMAL|HIGH` (canônico)

```
✓ Alinhado ao CLAUDE.md (identificadores em inglês)
✓ Banco já persiste DRAFT|NORMAL|HIGH (Prisma enum)
✓ Remove qualityMap espalhado pelo backend
✓ Helper qualityLabel(q) traduz para PT-BR só na UI
✗ Migração: atualizar 3 arquivos no shared/frontend/backend
```

### Opção B: Literal PT-BR `'rascunho'|'normal'|'alta'`

```
✓ Mais legível para devs br
✗ Viola "identificadores em inglês" (CLAUDE.md)
✗ Banco precisa migrar (DRAFT → rascunho)
✗ Termos como "alta" acoplam a interface ao idioma
```

### Opção C: Manter divergência (não consolidar)

```
✓ Zero migração
✗ Mantém débito técnico
✗ Risco continua: alguém pode usar "padrão" vs "normal" e introduzir bug
```

---

## Decisão

**Enum `PrintQuality { DRAFT, NORMAL, HIGH }` (Opção A)**

### Justificativa

1. **Conformidade com CLAUDE.md** — regra "identificadores em inglês" é explícita.
2. **Banco já é DRAFT/NORMAL/HIGH** — eliminar o `qualityMap` simplifica o backend.
3. **i18n responsável só pela UI** — helper `qualityLabel(q)` em `packages/shared` centraliza tradução; outros idiomas no futuro só precisam estender o helper.
4. **Custo da migração é pequeno** — 3 arquivos no shared/frontend, 1 no backend, mais o tipo no `PrintConfigPanel`.

---

## Consequências

### Positivas

- ✓ Tipo único em todo o monorepo; impossível usar variante errada.
- ✓ Backend deixa de fazer tradução — DTO valida o enum direto via Zod.
- ✓ Frontend mostra labels em PT-BR via helper, mas o `value` do `<select>` é o enum.
- ✓ Banco e código convergem (sem mapeamento implícito).

### Negativas

- ✗ Migração inicial precisa atualizar todos os pontos de uso (mitigado: investigação já mapeou todos).
- ✗ Devs br precisam lembrar que `DRAFT` = "rascunho" — `qualityLabel` resolve no nível UI.

### Mitigação

- Lint rule (futuro) que detecte literais `'rascunho'|'normal'|'alta'` em arquivos `.ts`/`.tsx` e sugira o enum.
- Documentar o helper `qualityLabel` em `sdd-docs/`.

---

## Especificação Técnica

### Localização

```typescript
// packages/shared/src/constants/index.ts
export enum PrintQuality {
  DRAFT = 'DRAFT',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}
```

### Helper de label PT-BR

```typescript
// packages/shared/src/index.ts (ou equivalente)
export function qualityLabel(q: PrintQuality): string {
  switch (q) {
    case PrintQuality.DRAFT:  return 'Rascunho';
    case PrintQuality.NORMAL: return 'Normal';
    case PrintQuality.HIGH:   return 'Alta';
  }
}
```

### Pontos a atualizar

- `packages/shared/src/types/settings.ts:4` — re-export do enum, remove literal.
- `packages/frontend/src/components/domain/PrintConfigPanel.tsx:4-11,41-50` — `value={PrintQuality.DRAFT}`, label via `qualityLabel`.
- `packages/frontend/src/types/printer.ts:39-52` — `quality?: PrintQuality` em `PrintOptions`.
- `packages/frontend/src/pages/PrintPage.tsx:122` — `mapQuality` retorna enum.
- `packages/backend/src/infrastructure/http/routes/print-jobs.routes.ts:108,130-134,141` — Zod aceita enum, remove `qualityMap`.

---

## Referências

- [CLAUDE.md §8 — Convenções de código](../../CLAUDE.md)
- [Spec 0032: Print Quality Fix](../specs/0032-print-quality-fix.md)
- [ADR 0004: Aplicação da qualidade via DEVMODE PowerShell](0004-aplicacao-qualidade-via-devmode-powershell.md)

---

## Status de Aprovação

- [x] Alinhado com spec 0032
- [x] Avaliadas alternativas (Opções A, B, C)
- [x] Mitigações documentadas
- [ ] Implementação iniciada (próximo passo)
