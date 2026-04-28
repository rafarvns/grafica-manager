# Feature: Tela de Configurações do Sistema

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a interface de configurações da gráfica: CRUD de tipos de papel, presets de impressão (combinações de qualidade, cores, acabamento) e tabela de preços unitários. Estes dados são compartilhados por toda a aplicação (seleção em pedidos, cálculo de custos) e devem ser gerenciáveis de forma centralizada.

## Requisitos Funcionais

- [ ] RF1 — Tela `/settings` com três abas/seções: "Tipos de Papel", "Presets de Impressão", "Tabela de Preços"
- [ ] RF2 — Seção "Tipos de Papel" (aba 1):
  - [ ] RF2a — Tabela listando: nome, peso (g/m²), tamanho padrão, cor, ativo (toggle)
  - [ ] RF2b — Botão "Novo Tipo de Papel" → modal com campos: nome (obrigatório), peso, tamanho, cor (select), ativo (checkbox)
  - [ ] RF2c — Clique em linha → modal de edição com campos preenchidos
  - [ ] RF2d — Botão "Deletar" por linha com confirmação (não permitir deleção se usado em pedidos ativos)
  - [ ] RF2e — Toggle "Ativo" para ativar/desativar tipo de papel (soft-delete lógico)
- [ ] RF3 — Seção "Presets de Impressão" (aba 2):
  - [ ] RF3a — Tabela listando: nome, papel (link), qualidade, cores, acabamento, preço estimado por unidade, ativo (toggle)
  - [ ] RF3b — Botão "Novo Preset" → modal com campos: nome (obrigatório), papel (select de tipos), qualidade (select: rascunho/padrão/premium), cores (select: P&B/colorido), acabamento (select: nenhum/lamináção/encadernação), ativo
  - [ ] RF3c — Clique em linha → modal de edição
  - [ ] RF3d — Botão "Deletar" com validação (não permitir se usado em pedidos recentes)
  - [ ] RF3e — Ao mudar papel/qualidade/cores, preview de custo atualiza em tempo real
- [ ] RF4 — Seção "Tabela de Preços" (aba 3):
  - [ ] RF4a — Tabela com: papel (fk), qualidade, cores, preço unitário (R$), data de validade, ativo (toggle)
  - [ ] RF4b — Botão "Nova Entrada" → modal com selects para papel/qualidade/cores e campo de preço
  - [ ] RF4c — Clique em linha → modal de edição
  - [ ] RF4d — Botão "Deletar"
  - [ ] RF4e — Busca por papel na tabela de preços (debounce)
  - [ ] RF4f — Se preço expirou (data_validade < hoje), linha exibe ícone de aviso e está desabilitado para novos pedidos
- [ ] RF5 — Validação de formulário: campos obrigatórios em tempo real (feedback inline)
- [ ] RF6 — Toasts de feedback: "Tipo de papel criado", "Preset atualizado", "Preço deletado", "Erro ao salvar"
- [ ] RF7 — Breadcrumb: Home / Configurações
- [ ] RF8 — Responsividade: tabelas viram cards em <768px

## Requisitos Não-Funcionais

- [ ] RNF1 — Dados carregados via fetch assíncrono (loading skeleton enquanto busca)
- [ ] RNF2 — Mudanças salvas via fetch POST/PATCH; validação de unicidade no servidor
- [ ] RNF3 — CSS Modules, sem styled-components
- [ ] RNF4 — Acessibilidade: modais com role="dialog", inputs com labels, tabs com role="tablist"
- [ ] RNF5 — Performance: tabelas com <1000 linhas (caso contrário, virtualização)

## Critérios de Aceite

### Cenário 1: Abrir tela de configurações
- **Given** usuário no layout principal
- **When** clica em "Configurações" no menu
- **Then** navegação leva a `/settings`, aba "Tipos de Papel" ativa por padrão, tabela carregada

### Cenário 2: Criar novo tipo de papel
- **Given** aba "Tipos de Papel" aberta
- **When** clica "Novo Tipo de Papel"
- **Then** modal abre com campos vazios
- **When** preenche nome="Couchê Matte", peso="150", tamanho="A4", cor="Branco", marca como ativo
- **When** clica "Salvar"
- **Then** papel é criado, modal fecha, toast "Tipo de papel criado", tabela atualiza

### Cenário 3: Editar tipo de papel
- **Given** "Couchê Matte" listado na aba
- **When** clica em linha ou botão "editar"
- **Then** modal abre com campos preenchidos
- **When** altera peso para "180" e salva
- **Then** tipo atualiza, toast "Tipo de papel atualizado"

### Cenário 4: Desativar tipo de papel (não deletar)
- **Given** "Couchê Matte" ativo
- **When** clica toggle "Ativo"
- **Then** linha fica cinzenta, tipo não aparece em seleções de novos pedidos, mas histórico mantém registros antigos

### Cenário 5: Tentar deletar tipo com pedidos ativos
- **Given** "Papel Sulfite" usado em 3 pedidos "agendado"
- **When** clica botão "Deletar"
- **Then** modal mostra: "Tipo de papel está em uso em 3 pedidos. Desative ao invés de deletar."
- **Then** botão "Deletar" fica desabilitado

### Cenário 6: Criar novo preset de impressão
- **Given** aba "Presets de Impressão" aberta
- **When** clica "Novo Preset"
- **Then** modal abre com campos: nome, papel (dropdown com Couchê, Sulfite...), qualidade (rascunho/padrão/premium), cores (P&B/colorido), acabamento (nenhum/laminação/encadernação)
- **When** preenche nome="Cartaz Premium", papel="Couchê", qualidade="premium", cores="colorido", acabamento="laminação"
- **When** clica "Salvar"
- **Then** preset criado, tabela atualiza, toast "Preset criado"

### Cenário 7: Visualizar custo estimado em tempo real
- **Given** modal de novo preset aberto
- **When** usuário seleciona papel="Couchê" (R$2/un), qualidade="premium" (+R$1), cores="colorido" (+R$0.50), acabamento="laminação" (+R$1)
- **Then** preview exibe: "Estimado: R$4,50 por unidade"

### Cenário 8: Criar entrada na tabela de preços
- **Given** aba "Tabela de Preços" aberta
- **When** clica "Nova Entrada"
- **Then** modal abre com selects para papel, qualidade, cores e campo de preço
- **When** seleciona papel="Sulfite", qualidade="padrão", cores="P&B", preço="0.50", validade="2026-12-31"
- **When** clica "Salvar"
- **Then** entrada criada, tabela atualiza

### Cenário 9: Preço expirado
- **Given** entrada com validade="2026-03-01" (passado)
- **When** visualiza tabela de preços
- **Then** linha exibe ícone de aviso (⚠), tooltip "Preço expirado", entrada não é selecionável em novos pedidos
- **When** tenta usar este preço em novo pedido
- **Then** sistema usa o preço válido mais recente (fallback)

### Cenário 10: Responsividade em mobile
- **Given** tela com 480px largura
- **When** tabelas são renderizadas
- **Then** convertem para cards empilhados (não tabela horizontal), cada card mostra 2–3 campos principais

## API Contract

Frontend consome endpoints dos specs 0007 (Print Parameters), 0008 (Print Recording):
- `GET /api/paper-types` — Listar tipos de papel
- `POST /api/paper-types` — Criar tipo
- `PATCH /api/paper-types/:id` — Atualizar tipo
- `DELETE /api/paper-types/:id` — Deletar tipo (com validação de uso)
- `GET /api/print-presets` — Listar presets
- `POST /api/print-presets` — Criar preset
- `PATCH /api/print-presets/:id` — Atualizar preset
- `DELETE /api/print-presets/:id` — Deletar preset
- `GET /api/price-table` — Listar tabela de preços
- `POST /api/price-table` — Criar entrada
- `PATCH /api/price-table/:id` — Atualizar entrada
- `DELETE /api/price-table/:id` — Deletar entrada

Documentar em `sdd-docs/api/settings.yaml`.

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0007-print-parameters-configuration.md](0007-print-parameters-configuration.md), [0008-print-recording-accounting.md](0008-print-recording-accounting.md)
- Pacotes/serviços externos: nenhum (React nativo)
- ADRs relevantes: nenhum

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/Settings.tsx` — página principal com 3 abas
  - `src/components/domain/PaperTypeSection.tsx` — aba 1: tipos de papel
  - `src/components/domain/PrintPresetSection.tsx` — aba 2: presets
  - `src/components/domain/PriceTableSection.tsx` — aba 3: tabela de preços
  - `src/components/domain/PaperTypeModal.tsx` — modal CRUD para papel
  - `src/components/domain/PrintPresetModal.tsx` — modal CRUD para preset (com preview de custo)
  - `src/components/domain/PriceTableModal.tsx` — modal CRUD para preço
  - `src/components/domain/ConfirmDeleteModal.tsx` — modal de confirmação (reutilizado)
  - `src/hooks/usePaperTypes.ts` — hook para fetch/CRUD de papel
  - `src/hooks/usePrintPresets.ts` — hook para fetch/CRUD de presets
  - `src/hooks/usePriceTable.ts` — hook para fetch/CRUD de preços
  - `src/services/settingsService.ts` — wrapper para API de configurações

- **Estado da página**:
  ```typescript
  interface SettingsState {
    activeTab: 'paperTypes' | 'presets' | 'priceTable';
    
    paperTypes: PaperType[];
    paperTypesLoading: boolean;
    
    printPresets: PrintPreset[];
    presetsLoading: boolean;
    presetCostPreview?: number; // atualiza em tempo real
    
    priceTableEntries: PriceTableEntry[];
    priceTableLoading: boolean;
    
    modals: {
      paperType?: boolean;
      printPreset?: boolean;
      priceTable?: boolean;
      confirmDelete?: boolean;
    };
    editingItem?: { type: 'paper' | 'preset' | 'price'; id: string };
  }
  ```

- **Fluxo de dados**:
  1. Página `/settings` monta, fetch GET de todos os dados (papel, presets, preços)
  2. Aba 1 renderiza tabela de papéis
  3. Clique "Novo Papel" → PaperTypeModal em modo "create"
  4. Preenchimento + validação inline
  5. Salvamento → fetch POST, tabela atualiza
  6. Clique "editar" → modal em modo "edit"
  7. Clique "deletar" → validação (se usado, desabilita; se não, permite)
  8. Aba 2: mesmo fluxo para presets, com preview de custo em tempo real
  9. Aba 3: fluxo de preços com validação de expiração

- **Preview de custo em presets**:
  - Ao mudar papel/qualidade/cores, buscar preço correspondente na PriceTable
  - Se encontra, exibir no preview; se não encontra ou expirou, exibir "-"
  - Usar debounce 200ms para não refazer cálculo a cada keystroke

- **Soft-delete de papel**:
  - Toggle "Ativo" não faz DELETE, apenas atualiza `deletedAt`
  - Queries filtra papéis com `deletedAt IS NULL`
  - UI mostra papéis inativos com opacidade 50%, label "[Inativo]"

- **Validação de deleção**:
  - Papel/preset usado em pedidos "agendado", "em_production", "completed" → bloqueia
  - Pedidos "cancelled", "shipping" não contam (finalizados)
  - Mensagem clara: "Em uso em 5 pedidos ativos"

- **CSS Modules**:
  - `Settings.module.css` — layout page com tabs
  - `PaperTypeSection.module.css` — tabela de papéis
  - `PrintPresetSection.module.css` — tabela de presets
  - `PriceTableSection.module.css` — tabela de preços
  - `PriceTableModal.module.css` — modal com preview de expiração

- **Acessibilidade**:
  - Abas com `role="tablist"`, cada aba com `role="tab"`
  - Modais com `role="dialog"` e focus trap
  - Inputs com `<label htmlFor="...">`
  - Toggles com `role="switch"` e `aria-checked`
  - Ícones de aviso/lixo com `aria-label` descritivos
  - Preço expirado com `aria-label="Preço expirado, válido até 2026-03-01"`

- **Testes esperados**:
  - Unit: validação de campos (nome obrigatório, preço > 0)
  - Unit: cálculo de custo estimado (papel + qualidade + cores + acabamento)
  - Unit: detecção de preço expirado (data_validade < hoje)
  - Integration: CRUD de papel via API, tabela atualiza
  - Integration: CRUD de preset com preview de custo
  - Integration: CRUD de preço com validação de expiração
  - Integration: deletar papel com pedidos ativos → erro, botão desabilitado
  - E2E: abrir `/settings` → criar papel → criar preset → visualizar custo → salvar
  - E2E: tentar deletar papel em uso → validação bloqueia
  - E2E: criar preço com validade futura → usar em pedido → verificar preço aplica

- **Riscos**:
  - Performance: tabela de preços com 10k+ linhas → paginação obrigatória
  - Custo duplicado: dois preços válidos para mesma combinação (papel/qualidade/cores) → usar mais recente
  - Deleção física: se permitir, quebra histórico de custo em impressões antigas → soft-delete obrigatório
  - Concorrência: usuário A e B editam mesmo papel simultaneamente → último vence (confirm update)
  - Mobile: tabelas com muitas colunas → converter para cards (não pode esconder colunas)

- **Implementação sugerida (ordem)**:
  1. Criar page `/settings` com layout de 3 abas
  2. Criar hook `usePaperTypes` para fetch
  3. Criar `PaperTypeSection` tabela paginada
  4. Criar `PaperTypeModal` CRUD
  5. Validação de deleção (se em uso, bloqueia)
  6. Soft-delete com toggle "Ativo"
  7. Criar `usePrintPresets` hook
  8. Criar `PrintPresetSection` + modal
  9. Implementar preview de custo em tempo real
  10. Criar `usePriceTable` hook
  11. Criar `PriceTableSection` + modal
  12. Validação de expiração de preço
  13. CSS, responsividade, acessibilidade
  14. Testes E2E completos

---

**Esta spec cobre o frontend de configuração de dados de 0007 (Print Parameters) e 0008 (Print Recording).**
