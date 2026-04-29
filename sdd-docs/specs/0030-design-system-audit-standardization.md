# Feature: Auditoria e Padronização do Design System Frontend

> Status: `draft` · Autor: rafarvns · Data: 2026-04-29

## Contexto

O frontend está com estilos completamente despadronizados: tokens CSS não definidos mas usados, cores hardcoded em 25+ lugares, box-shadows com 20+ variações, z-indexes conflitantes e componentes de domínio que ignoram os primitivos UI. Esta spec define o plano de padronização via um Design System formal documentado.

**Escopo desta spec:** documentar achados + criar o documento de Design System + criar a skill de enforcement. Nenhuma mudança de código de produção nesta fase.

---

## Achados da Auditoria (29/04/2026)

### Sumário

| Severidade | Quantidade | Categoria |
|-----------|-----------|-----------|
| 🔴 Crítica | 3 | Variáveis não definidas, Z-index, Box-shadow |
| 🟡 Maior | 3 | Font-weight, Border-radius, Espaçamentos |
| 🟠 Moderada | 3 | Badge colors, Modal backdrop, Domain ≠ UI |

**Total de inconsistências encontradas:** 47 em 65 arquivos CSS + 12 TSX auditados.

---

### 🔴 Críticas

#### C1 — Variáveis CSS Usadas Mas Não Definidas

As seguintes variáveis são referenciadas em componentes mas **não existem** em `index.css`:

```
--spacing-xs        → Select, Textarea, Checkbox, Tabs, Tooltip
--spacing-sm        → Select, Textarea, Table, Badge, CustomerForm
--spacing-md        → Select, Table, CustomerFilters
--spacing-lg        → (vários)
--font-size-md      → Select, Textarea
--font-size-xs      → Table
--color-primary-light → Select, Textarea, OrderForm
--color-background  → Select, Textarea, Table
--color-error-light → OrderForm
--color-error       → OrderForm
```

**Impacto:** Comportamento visual indefinido — o browser usa fallback (geralmente transparente ou valor inicial).

#### C2 — Z-Index Sem Escala Definida

| Componente | Z-index | Arquivo |
|-----------|---------|---------|
| Modal (base) | 50 | Modal.module.css |
| OrderForm, CustomerForm, ConfirmDeleteModal | 1000 | Respectivos .module.css |
| OrderModal | 1001 | OrderModal.module.css |
| Toast | 9999 | Toast.module.css |

Sem escala definida, camadas sobrepõem incorretamente.

#### C3 — Box-Shadow Completamente Hardcoded

20+ variações de `box-shadow` espalhadas pelo codebase:

```css
/* Encontradas em componentes de domínio */
0 4px 16px rgba(0, 0, 0, 0.15)         /* OrderForm.module.css */
0 10px 40px rgba(0, 0, 0, 0.2)         /* CustomerForm.module.css */
0 25px 50px rgba(0, 0, 0, 0.25)        /* OrderModal.module.css */
0 4px 20px rgba(0, 0, 0, 0.15)         /* ConfirmDeleteModal.module.css */
0 4px 12px rgba(0, 0, 0, 0.08)         /* OrderKanban.module.css */
-4px 0 15px rgba(0, 0, 0, 0.1)         /* CustomerProfile.module.css */
```

---

### 🟡 Maiores

#### M1 — Font-Weight Hardcoded

`font-weight: 600` aparece em 30+ arquivos CSS. O token `--font-weight-semibold` não existe em `index.css` (que define apenas 400, 500 e 700). Todo uso de 600 é tecnicamente inválido no design system atual.

Também encontrado `font-weight: 800` em `OrdersPage.module.css:17`.

#### M2 — Border-Radius Fora dos Tokens

Tokens definidos: `--radius-sm (4px)`, `--radius-md (8px)`, `--radius-lg (12px)`.

Valores hardcoded encontrados: **3px, 6px, 10px, 50%** — nenhum deles é token.

#### M3 — Espaçamentos Hardcoded em 30+ Arquivos

| Valor | Frequência | Instâncias |
|-------|-----------|-----------|
| `1rem` (16px) | 15+ | OrderForm, CustomerForm, CustomerProfile |
| `1.5rem` (24px) | 10+ | OrderForm, CustomerProfile, OrderFileUpload |
| `12px` | 30+ | OrderTable, CustomerTable, CustomerFilters |
| `16px` | 25+ | OrderTable, CustomerFilters, CustomerTable |
| `20px` | 15+ | OrderForm, CustomerForm, PriceTableManager |
| `24px` | 10+ | OrderDetailsSection, CustomerProfile |

---

### 🟠 Moderadas

#### O1 — Cores de Badge Completamente Hardcoded

```css
/* Badge.module.css — sem nenhum token */
.success { background: #d1fae5; color: #065f46; }
.warning { background: #fef3c7; color: #92400e; }
.danger  { background: #fee2e2; color: #991b1b; }
.primary { background: #dbeafe; color: #1e3a5f; }
```

#### O2 — Backdrop de Modal com 4 Variações de Opacidade

```css
rgba(0, 0, 0, 0.4)   /* CustomerForm */
rgba(0, 0, 0, 0.5)   /* OrderForm, ConfirmDelete, Modal base */
rgba(0, 0, 0, 0.7)   /* OrderModal */
```

#### O3 — Componentes de Domínio Ignoram Primitivos UI

`OrderForm.tsx`, `CustomerForm.tsx` e outros criam seus próprios inputs, buttons e containers inline ao invés de usar `<Input />`, `<Button />`, `<Card />` de `components/ui/`.

---

### Status dos Componentes UI Base

| Componente | Uso de Tokens | Status |
|-----------|--------------|--------|
| Button | ✅ 95% | Bom |
| Input | ✅ 100% | Excelente |
| Card | ✅ 100% | Excelente |
| Spinner | ✅ 90% | Bom |
| Modal | ✅ 80% | Bom |
| Checkbox | ⚠️ 80% | Médio — `--spacing-*` inexistente |
| Table | ⚠️ 70% | Médio — tokens misturados |
| Select | ❌ 60% | Ruim — série `--spacing-*` toda errada |
| Textarea | ❌ 60% | Ruim — série `--spacing-*` toda errada |
| Badge | ❌ 30% | Ruim — cores completamente hardcoded |
| Toast | ❌ 40% | Ruim — muitos valores hardcoded |

---

## Requisitos Funcionais

- [ ] RF1 — Criar documento `sdd-docs/design-system.md` com todas as decisões de design codificadas.
- [ ] RF2 — Definir escala completa de tokens CSS em `index.css` cobrindo todos os gaps da auditoria.
- [ ] RF3 — Definir escala de z-index (`--z-dropdown`, `--z-modal`, `--z-toast`).
- [ ] RF4 — Definir tokens de box-shadow (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`).
- [ ] RF5 — Definir `--font-weight-semibold` e remover valores 600/800 hardcoded.
- [ ] RF6 — Definir série `--spacing-*` ou alinhar referências existentes para `--space-*`.
- [ ] RF7 — Criar skill `frontend-ds` que enforça o design system em qualquer task de frontend.
- [ ] RF8 — Documentar padrões de componente: como usar Button, Input, Modal, Badge, Toast corretamente.

## Requisitos Não-Funcionais

- [ ] RNF1 — Design system deve funcionar no alvo de 4GB RAM/dual-core — zero overhead de runtime.
- [ ] RNF2 — Tokens devem estar exclusivamente em CSS custom properties (zero JS runtime de temas).

## Critérios de Aceite

### Cenário 1: Design System documentado
- **Given** o arquivo `sdd-docs/design-system.md` existe
- **When** um desenvolvedor ou IA precisa criar/modificar um componente
- **Then** o documento responde: qual token usar, qual componente UI usar, qual padrão seguir

### Cenário 2: Skill `frontend-ds` ativa
- **Given** a skill `/frontend-ds` está disponível
- **When** é invocada antes de uma task de frontend
- **Then** o agente segue estritamente os tokens e padrões do design system

### Cenário 3: Gaps de tokens identificados e cobertos
- **Given** o design system foi formalizado
- **When** qualquer arquivo CSS referencia uma variável
- **Then** essa variável está definida em `index.css`

## API Contract

N/A

## Dependências

- Specs relacionadas: `0003-estrutura-base-frontend.md`, `0004-componentes-ui-base.md`, `0029-remove-theme-toggle.md`
- Pacotes/serviços externos: nenhum
- ADRs relevantes: nenhum (criar ADR se decidir adotar nomenclatura `--spacing-*` vs `--space-*`)

## Notas de Implementação

- Camadas afetadas: frontend apenas (styles + documentação + tooling)
- Testes esperados: nenhum — é documentação e tokens CSS
- Ordem de execução recomendada:
  1. Criar `sdd-docs/design-system.md` ← esta spec
  2. Criar skill `frontend-ds` ← esta spec
  3. Adicionar tokens faltantes em `index.css` ← spec 0031
  4. Corrigir componentes UI base (Select, Textarea, Badge, Toast) ← spec 0031
  5. Refatorar páginas e componentes domain ← spec 0032+
- Riscos: décision sobre `--space-*` vs `--spacing-*` precisa de consenso antes de qualquer refactor
