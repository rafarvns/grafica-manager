# ADR 0007: Manual duplex via wizard de duas passagens

**Status:** Accepted
**Date:** 2026-05-05
**Author:** rafarvns
**Context Specs:** 0033 (Manual Duplex Wizard)

---

## Contexto

Várias impressoras alvo do gráfica-manager — incluindo a Epson L3250 — não têm mecanismo de duplex automático (não viram o papel sozinhas). Hoje, ao detectar `supportsDuplex=false` via `DeviceCapabilities(DC_DUPLEX)`, a app desabilita as opções de "Frente e verso" no `PrintConfigPanel`, forçando o usuário a imprimir só frente.

Para essas impressoras, há um workflow viável (presente no Word, Acrobat e drivers de outras suites): imprimir páginas ímpares primeiro, o usuário vira o maço de folhas, recoloca na bandeja, e o sistema imprime as pares. Mas isso exige:
1. Conhecer o número de páginas do documento
2. Calcular ranges "1,3,5..." e "2,4,6..."
3. Operar 2 prints sequenciais
4. Saber em que sentido virar (longo vs curto)
5. Saber se a ordem das pares é normal ou invertida (depende do sentido de ejeção do papel)

**Operadores de gráfica menos técnicos não conseguem fazer isso manualmente.** A app precisa orquestrar.

---

## Decisão

**Wizard guiado** ativado quando o usuário escolhe explicitamente "Frente e verso manual (longo)" ou "Frente e verso manual (curto)" no `PrintConfigPanel`. Essas opções aparecem **no lugar das opções de hardware duplex** quando a impressora não tem duplex automático.

### Mecânica

```
PrintPage.executePrint() →
  if config.side é manualduplex|manualduplexshort e totalPages > 1:
    confirmed = await ipcBridge.showPrinterPreferences(...)   // gate ADR 0005
    if !confirmed: return  // cancel silencioso, wizard NÃO abre
    abre <ManualDuplexWizard isOpen=true />
    // wizard cuida das duas passagens — ambas com skipPrinterDialog=true

ManualDuplexWizard:
  1. Confirm: mostra resumo (N páginas, X folhas, ordem) + botão "Iniciar"
  2. PrintingFront: chama onRunPass("1,3,5,...") com skipPrinterDialog=true
  3. Flip: ilustração SVG (longa = livro, curta = caderno) + instruções numeradas
  4. PrintingBack: chama onRunPass("2,4,6,...") com skipPrinterDialog=true
  5. Done: ✅ + nota se houver página orphan (totalPages ímpar)

  cancel no flip: confirm inline "frente já impressa, deixará incompleto", se OK → POST /print-jobs com status=cancelled, partial=true
```

**Importante:** o diálogo nativo de Preferências aparece UMA vez (gate ADR 0005) ANTES de o wizard abrir. As duas passagens dentro do wizard usam `skipPrinterDialog: true` para não reabrir o diálogo. O `SetPrinter` level 9 dentro de `showPrinterPreferences` (no caso de OK) já persistiu o DEVMODE escolhido como default da impressora; as passagens silenciosas usam esse default automaticamente.

### Justificativa

1. **UX guiada** — usuário não precisa conhecer ranges, ordem ou mecânica. Cada step diz exatamente o que fazer.
2. **Opção explícita no select** — quando manual é a única opção, o label deixa claro ("Frente e verso manual"). Sem surpresas.
3. **Reaproveita o pipeline atual** — wizard chama o IPC `printer:print-pdf` existente com `pages` filtrado. Sem mudança no backend de impressão.
4. **Gate Win32 antes do wizard** — ADR 0005 (gate cancelável) é preservado: o usuário vê o diálogo nativo de Preferências, confirma quality/cor, e só então o wizard inicia. Cancel no diálogo aborta tudo silenciosamente.
5. **Skip dialog nas passagens** — `skipPrinterDialog: true` em ambas as passagens do wizard evita abrir o gate Win32 três vezes (UX insuportável).
6. **Captura DEVMODE (ADR 0006) ainda funciona** — gate populará/usará o cache normalmente; as passagens silenciosas herdam a config persistida via `SetPrinter` level 9.

### Hardcode da ordem das páginas pares

Para o MVP, pares saem na **ordem normal** (2, 4, 6, ...). Isso funciona para impressoras inkjet com **ejeção face-up** (Epson L3250 e a maioria das EcoTank/L-series). Para lasers com ejeção face-down, a ordem correta seria reverse (6, 4, 2). Calibração por impressora fica para v2 — se usuários reclamarem que "as páginas saíram trocadas", adicionar toggle "Inverter ordem das pares" nas configurações da impressora e persistir por nome.

### Cancelamento

- **Step 1 (confirm):** cancela limpo, sem print, sem POST.
- **Step 3 (flip prompt):** confirm inline; se confirmar → POST `/print-jobs` com `status=cancelled, duplexMode=manual_long|short` para registrar parcial. Frente já está impressa fisicamente — usuário decide o que fazer com as folhas.
- **Steps 2 e 4 (durante print):** sem botão de cancel — `pdf-to-printer.print` é one-shot, não interrompível. Print é rápido (folhas individuais), aceitável.

---

## Consequências

### Positivas

- ✓ Frente e verso disponível em qualquer impressora, mesmo sem duplex hw.
- ✓ Operadores não precisam de conhecimento técnico — wizard explica cada passo com ilustração.
- ✓ Quality persistente entre passagens (via cache DEVMODE da ADR 0006).
- ✓ Detecção de duplex hw (ADR via `usePrinterCapabilities`) controla a UX automaticamente: hw → 3 opções padrão; sem hw → simplex + 2 manuais.

### Negativas

- ✗ Hardcode de ordem normal pode dar resultado errado em lasers face-down (raro no contexto de gráfica de balcão). Mitigação: feature de calibração na v2.
- ✗ `duplexMode` não é persistido no banco hoje (só logado). Migration futura para coluna dedicada.
- ✗ Wizard é state-ful (5 steps internos) — mais código vs. um print silent comum.
- ✗ Adiciona um clique a mais (OK no diálogo) antes de o wizard abrir. Aceito porque preserva controle visual da config e o gate cancelável da ADR 0005.

### Mitigação

- **Página orphan:** wizard avisa explicitamente no step 1 e no step 5 ("a última página ficou só com frente").
- **Falha mid-flow:** step de erro com botão "Tentar novamente" que retoma do step 3 (flip), sem reimprimir frente.
- **Cache DEVMODE não populado:** o gate antes do wizard é responsável por popular/usar o cache (ADR 0006). Primeira impressão abre dialog sem prefill (graceful), as próximas já vêm com a quality cacheada.

---

## Especificação Técnica

### Arquivos novos

| Arquivo | Função |
| --- | --- |
| `packages/frontend/src/utils/manualDuplex.ts` | `computeManualDuplexPasses(N, evenOrder)` retorna `{pass1, pass2, hasOrphanLastPage}`; `formatPagesParam([1,3,5])` → `"1,3,5"` |
| `packages/frontend/src/components/domain/ManualDuplexWizard.tsx` + `.module.css` | Modal com 5 steps + SVG `<FlipIllustration type="long\|short">` inline |
| `packages/frontend/tests/unit/utils/manualDuplex.spec.ts` | 7 casos: pares, ímpares, evenOrder reverse, edge cases (1 página, 0 páginas) |

### Arquivos modificados

| Arquivo | Mudança |
| --- | --- |
| `packages/frontend/src/types/printer.ts` | `PrintOptions.skipPrinterDialog?: boolean` |
| `packages/frontend/src/components/domain/PrintConfigPanel.tsx` | `PrintConfig.side` aceita `'manualduplex' \| 'manualduplexshort'`; select mostra opções manuais quando `!supportsDuplex` |
| `packages/frontend/src/components/domain/PdfPreview.tsx` | prop opcional `onTotalPagesChange?: (n: number) => void` |
| `packages/frontend/src/pages/PrintPage.tsx` | state `pdfTotalPages`, `wizardOpen`; `executePrint` desvia para wizard se `isManualDuplex`; helpers `sideToDuplexMode` e `toIpcSide`; integração de `<ManualDuplexWizard>` |
| `packages/frontend/electron/ipc/printer.ts` | `skipPrinterDialog: true` pula `showPrinterPreferences` e vai direto pro print silent. Novo handler `printer:show-preferences` expõe o gate sozinho (sem print) para o wizard chamar antes de iniciar |
| `packages/frontend/electron/preload.ts` + `src/types/electron.d.ts` + `src/services/ipcBridge.ts` | Expõem `showPrinterPreferences` ao renderer |
| `packages/frontend/src/types/printer.ts` | Novo tipo `PrintPreferencesPrefill` |
| `packages/backend/src/infrastructure/http/routes/print-jobs.routes.ts` | aceita `duplexMode` no POST body (logado, não persistido — TODO migration) |

### Lógica de paginação

```typescript
computeManualDuplexPasses(6) →
  { pass1: [1,3,5], pass2: [2,4,6], hasOrphanLastPage: false }

computeManualDuplexPasses(5) →
  { pass1: [1,3,5], pass2: [2,4],  hasOrphanLastPage: true }

computeManualDuplexPasses(1) →
  { pass1: [1], pass2: [], hasOrphanLastPage: true }
  (PrintPage detecta totalPages===1 e cai no fluxo simplex normal — wizard nem abre)
```

### duplexMode enum (frontend → backend)

| Valor | Origem |
| --- | --- |
| `simplex` | side=`simplex` |
| `hardware_long` | side=`duplex` (com `supportsDuplex=true`) |
| `hardware_short` | side=`duplexshort` |
| `manual_long` | side=`manualduplex` (wizard) |
| `manual_short` | side=`manualduplexshort` (wizard) |

---

## Referências

- [Spec 0033: Manual Duplex Wizard](../specs/0033-manual-duplex.md)
- [ADR 0005: Diálogo como gate via DocumentProperties](0005-print-preferences-gate-via-documentproperties.md) — `skipPrinterDialog` é um opt-out desse gate
- [ADR 0006: Capture-replay de DEVMODE](0006-capture-replay-devmode-prefill.md) — quality entre passagens vem desse cache
- Win32 `DeviceCapabilities(DC_DUPLEX)` — base da detecção de hardware duplex

---

## Status de Aprovação

- [x] Alinhado com spec 0033
- [x] Avaliadas alternativas (auto-trigger vs. opção explícita; calibração no MVP vs. depois)
- [x] Mitigações documentadas
- [x] Implementação MVP concluída (sem calibração; sem migration)
