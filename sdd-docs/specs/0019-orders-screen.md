# Feature: Tela de Pedidos (Lista + Formulário)

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a interface completa de gerenciamento de pedidos: listagem com filtros avançados (status, cliente, período), visualização em kanban ou lista, criação de novo pedido manual com seleção de cliente, upload de arquivos, e edição de pedidos já existentes.

## Requisitos Funcionais

- [ ] RF1 — Tela `/orders` com listagem de pedidos (padrão: 25 por página)
- [ ] RF2 — Filtros avançados: status (multi-select), cliente (dropdown), período (data início/fim), origem (Shopee/manual)
- [ ] RF3 — Visualização em kanban: colunas por status (draft, scheduled, in_production, completed, shipping, cancelled)
- [ ] RF4 — Alternativa: visualização em lista com status como coluna, sorting por qualquer coluna
- [ ] RF5 — Botão "Novo Pedido" abre modal/drawer com formulário de criação
- [ ] RF6 — Formulário com campos: cliente (seleção obrigatória), descrição, quantidade, tipo de papel, dimensões, data limite, preço de venda, custo estimado
- [ ] RF7 — Upload de arquivos no formulário (PDF, imagens) com preview e remoção
- [ ] RF8 — Salvar pedido cria no banco com número único (ex: "ORD-001") e status "draft"
- [ ] RF9 — Clique em pedido na listagem → abre detalhe do pedido (spec 0020)
- [ ] RF10 — Editar pedido em status "draft" ou "scheduled": clique "editar" → modal com campos preenchidos
- [ ] RF11 — Editar pedido em status "shipping": desabilitado (read-only)
- [ ] RF12 — Drag-and-drop em kanban: mover pedido entre colunas muda status
- [ ] RF13 — Validação de campos obrigatórios no formulário (cliente, descrição, quantidade, preço)
- [ ] RF14 — Toasts de feedback: "Pedido criado", "Pedido atualizado", "Pedido movido para [status]"

## Requisitos Não-Funcionais

- [ ] RNF1 — Listagem carregada via fetch assíncrono com spinner de carregamento
- [ ] RNF2 — Paginação se em modo "lista"; kanban rola horizontalmente se muitos pedidos
- [ ] RNF3 — Responsivo: kanban vira lista em <900px; formulário adapta em mobile
- [ ] RNF4 — Validação de período: data início <= data fim
- [ ] RNF5 — CSS Modules, sem styled-components
- [ ] RNF6 — Acessibilidade: inputs com labels, modais com role="dialog", drag-drop com keyboard support

## Critérios de Aceite

### Cenário 1: Abrir tela de pedidos
- **Given** usuário está no layout principal
- **When** clica em "Pedidos" no menu
- **Then** navegação leva a `/orders`, listagem é carregada (kanban ou lista), filtros visíveis

### Cenário 2: Filtrar pedidos por status
- **Given** tela de pedidos aberta
- **When** clica em filtro "Status" e seleciona "em_production"
- **Then** listagem atualiza, exibindo apenas pedidos em produção

### Cenário 3: Filtrar por cliente e período
- **Given** filtros abertos
- **When** seleciona cliente "João", data início "2026-04-01", data fim "2026-04-30"
- **Then** listagem exibe pedidos de João no mês de abril

### Cenário 4: Criar novo pedido
- **Given** tela de pedidos, clica "Novo Pedido"
- **When** modal abre com formulário vazio
- **Then** usuário seleciona cliente "Maria", preenche descrição="Cartaz A1 CMYK", quantidade=10, papel="Couchê", dimensões="100x50cm", data limite="2026-05-10", preço=500.00, custo=100.00, clica "Salvar"
- **Then** pedido é criado com número "ORD-001", status "draft", modal fecha, toast "Pedido criado com sucesso", kanban/lista atualiza

### Cenário 5: Upload de arquivo
- **Given** formulário de novo pedido aberto
- **When** usuário clica em "Adicionar Arquivo" e seleciona PDF
- **Then** arquivo é listado na seção "Arquivos" com preview e botão de remover

### Cenário 6: Drag-drop em kanban
- **Given** kanban visível com pedidos em diferentes colunas
- **When** usuário arrasta pedido "ORD-001" da coluna "draft" para "scheduled"
- **Then** pedido move, status é atualizado no banco, toast "Pedido movido para agendado"

### Cenário 7: Editar pedido em draft
- **Given** pedido "ORD-001" em status "draft"
- **When** usuário clica "editar"
- **Then** modal abre com campos preenchidos (cliente, descrição, etc.)
- **Then** usuário altera quantidade para 15, clica "Atualizar"
- **Then** pedido é atualizado, modal fecha, toast "Pedido atualizado"

### Cenário 8: Bloquear edição em shipping
- **Given** pedido em status "shipping"
- **When** usuário tenta clicar "editar"
- **Then** botão está desabilitado ou não aparece; clique direto no pedido abre detalhes em modo read-only

### Cenário 9: Validação de formulário
- **Given** formulário de novo pedido aberto
- **When** usuário deixa "cliente" vazio e clica "Salvar"
- **Then** erro: "Cliente é obrigatório"

### Cenário 10: Visualizar em lista
- **Given** kanban ativo
- **When** usuário clica botão "Mudar para Lista"
- **Then** visualização muda para tabela com colunas: número, cliente, status, data limite, preço, ações

## API Contract

Frontend consome endpoints do spec 0010 (Manual Order CRUD) e 0011 (Linking):
- `GET /api/orders` — Listar com filtros e paginação
- `POST /api/orders` — Criar pedido manual
- `PATCH /api/orders/:id` — Atualizar pedido
- `POST /api/orders/:id/status` — Mudar status
- `POST /api/orders/:id/attachments` — Upload de arquivo
- `DELETE /api/orders/:id/attachments/:fileId` — Remover arquivo
- `GET /api/orders/:id` — Detalhe do pedido

Documentar em `sdd-docs/api/orders.yaml` (conforme spec 0010).

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0018-customers-screen.md](0018-customers-screen.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0020-order-detail-screen.md](0020-order-detail-screen.md)
- Pacotes/serviços externos: `react-beautiful-dnd` ou `dnd-kit` (drag-drop em kanban)
- ADRs relevantes: nenhum

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/Orders.tsx` — página principal (layout da tela)
  - `src/components/domain/OrderKanban.tsx` — visualização kanban com colunas por status
  - `src/components/domain/OrderList.tsx` — visualização lista com tabela paginada
  - `src/components/domain/OrderFilters.tsx` — barra de filtros (status, cliente, período, origem)
  - `src/components/domain/OrderModal.tsx` — modal para criar/editar pedido
  - `src/components/domain/OrderFileUpload.tsx` — componente de upload com preview
  - `src/hooks/useOrders.ts` — hook para fetch, filtros, kanban state
  - `src/hooks/useOrderForm.ts` — hook para validação e envio do formulário

- **Estado da página**:
  ```typescript
  interface OrdersState {
    orders: Order[];
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    totalCount: number;
    view: 'kanban' | 'list'; // Qual visualização
    filters: {
      statuses?: OrderStatus[];
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      origin?: 'SHOPEE' | 'MANUAL' | 'ALL';
    };
  }
  ```

- **Kanban columns** (6 colunas):
  - `draft` — Rascunho
  - `scheduled` — Agendado
  - `in_production` — Em Produção
  - `completed` — Concluído
  - `shipping` — Enviado
  - `cancelled` — Cancelado

- **Fluxo de dados**:
  1. Página `/orders` monta, fetch de orders com filtros padrão
  2. Escolher visualização: kanban (padrão) ou lista
  3. Filtros: status (multi), cliente (single), período (range), origem (multi)
  4. Clique "Novo Pedido" → OrderModal abre em modo "create"
  5. Seleção de cliente → validação de cliente existente
  6. Upload de arquivo → preview e listagem de arquivos
  7. Preenchimento de forma → validação em tempo real
  8. Salvamento → fetch POST `/api/orders`, ordernumber gerado no backend
  9. Sucesso → toast, modal fecha, kanban/lista atualiza
  10. Drag-drop em kanban → fetch POST `/api/orders/:id/status`, coluna atualiza
  11. Clique em pedido → navigate para `/orders/:id` (spec 0020)
  12. Editar → OrderModal em modo "edit"

- **Validação de formulário**:
  - Cliente: obrigatório, deve existir
  - Descrição: obrigatório, min 10 caracteres
  - Quantidade: obrigatório, > 0
  - Papel: obrigatório (seleção de PaperType)
  - Dimensões: obrigatório, formato "100x50cm"
  - Data limite: obrigatório, deve ser >= hoje
  - Preço: obrigatório, >= 0
  - Custo: obrigatório, >= 0

- **Upload de arquivos**:
  - Aceita: PDF, PNG, JPG, GIF (max 10MB por arquivo)
  - Mostra preview em miniatura
  - Permite remover antes de salvar

- **CSS Modules**:
  - `Orders.module.css` — layout page com view switcher
  - `OrderKanban.module.css` — kanban grid com 6 colunas, drag-drop styling
  - `OrderList.module.css` — tabela com hover, status badge colors
  - `OrderModal.module.css` — modal com form sections (cliente, descrição, financeiro, arquivos)
  - `OrderFileUpload.module.css` — upload area, preview, remove button

- **Drag-drop library**:
  - Recomendação: `dnd-kit` (leve, acessível)
  - Alternativa: `react-beautiful-dnd` (popular, bem documentado)
  - Keyboard support obrigatório (ARAR key para reordenar)

- **Acessibilidade**:
  - Form inputs com `<label htmlFor="...">`
  - Modals com `role="dialog"` e focus trap
  - Kanban columns com `role="region"` e `aria-label`
  - Drag-drop com keyboard support (não só mouse)
  - Status badges com cores + texto (não só cor)
  - Tooltips em botões desabilitados

- **Testes esperados**:
  - Unit: validação de período (data início <= data fim)
  - Unit: validação de formulário (obrigatórios, ranges)
  - Unit: formatação de dimensões (parsing "100x50cm")
  - Integration: fetch de orders com filtros combinados
  - Integration: criar/editar/deletar pedido via API
  - Integration: drag-drop em kanban, status atualiza no banco
  - E2E: abrir `/orders` → criar pedido → upload arquivo → mover em kanban → navegar para detalhe
  - E2E: filtrar por cliente + período → lista atualiza
  - E2E: editar pedido em draft → status muda em kanban
  - E2E: verificar leitura de pedido em "shipping"

- **Riscos**:
  - Performance: muitos pedidos (10k+) em kanban pode ser lento → virtualização ou paginação
  - Drag-drop: sincronização com backend pode ter race conditions (2 usuários movem mesmo pedido)
  - Upload: arquivos grandes podem travar upload → mostrar progresso e permitir cancel
  - Responsividade: kanban em mobile é ruim → converter para lista automático
  - Validação de dimensões: parsing de string "100x50cm" é frágil → usar input numérico duplo (width, height)

- **Implementação sugerida (ordem)**:
  1. Criar page `/orders` com layout básico
  2. Criar hook `useOrders` para fetch com filtros
  3. Criar `OrderKanban` com 6 colunas (sem drag-drop ainda)
  4. Criar `OrderList` tabela paginada
  5. Implementar view switcher (kanban ↔ lista)
  6. Criar `OrderFilters` com 4 tipos
  7. Integrar filtros com fetch
  8. Criar `OrderModal` para criar/editar
  9. Validação de form em tempo real
  10. Implementar upload de arquivos
  11. Adicionar drag-drop em kanban (dnd-kit)
  12. Status update via drag-drop
  13. CSS, responsividade, acessibilidade
  14. Testes E2E completos

---

**Esta spec depende de 0017 (Layout), 0018 (Clientes) e 0010 (Backend), e desbloqueia 0020 (Detalhe do Pedido).**
