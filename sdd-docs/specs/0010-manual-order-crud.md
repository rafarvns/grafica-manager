# Feature: Manual Order CRUD

> Status: `implemented` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar operações de gerenciamento de pedidos criados manualmente, permitindo criar, listar, editar, cancelar e rastrear status de produção, com preço de venda e custo de produção registrados.

## Requisitos Funcionais

- [x] RF1 — Criar pedido com: cliente (seleção), descrição, quantidade, tipo de papel, dimensões, data limite, preço de venda, custo de produção estimado
- [x] RF2 — Listar pedidos com filtros (cliente, status, período, número do pedido)
- [x] RF3 — Visualizar detalhe completo do pedido com histórico de mudanças de status
- [x] RF4 — Editar pedido — qualquer campo editável exceto quando status for "shipping"
- [x] RF5 — Mudar status do pedido livremente entre: rascunho, agendado, em produção, concluído, enviado (shipping), cancelado
- [x] RF6 — Cancelar pedido com motivo obrigatório
- [x] RF7 — Associar arquivos ao pedido (PDF, imagens) — armazenados em disco local da aplicação
- [x] RF8 — Remover arquivo associado ao pedido

## Requisitos Não-Funcionais

- [x] RNF1 — Pedido em status "shipping" é read-only (sem edição de nenhum campo)
- [x] RNF2 — Transições de status são livres (pode ir de qualquer estado para qualquer outro, exceto: pedido cancelado não pode mudar de status)
- [x] RNF3 — Histórico de mudanças de status imutável (quem, quando, de qual para qual)
- [x] RNF4 — Paginação eficiente com índices (suporta milhares de pedidos)
- [x] RNF5 — Validação: quantidade > 0, preço ≥ 0, custo ≥ 0, cliente existente

## Critérios de Aceite

### Cenário 1: Criar pedido manual
- **Given** formulário de novo pedido aberto
- **When** usuário seleciona cliente, preenche descrição, quantidade, papel, dimensões, data limite, preço e custo e clica "Criar"
- **Then** pedido criado com status "rascunho" e número único, exibindo mensagem de sucesso

### Cenário 2: Mudar status livremente
- **Given** pedido em status "rascunho"
- **When** usuário altera diretamente para "em produção" (pulando "agendado")
- **Then** status é atualizado, transição registrada no histórico com timestamp

### Cenário 3: Bloquear edição em "shipping"
- **Given** pedido em status "shipping"
- **When** usuário tenta editar qualquer campo
- **Then** campos ficam desabilitados; mensagem "Pedido enviado — não é possível editar"

### Cenário 4: Cancelar pedido
- **Given** pedido em qualquer status exceto "cancelado"
- **When** usuário clica "Cancelar" e fornece motivo
- **Then** status muda para "cancelado", motivo registrado no histórico, nenhuma edição ou transição futura permitida

### Cenário 5: Anexar arquivo ao pedido
- **Given** pedido criado
- **When** usuário seleciona PDF/imagem via dialog
- **Then** arquivo é salvo em disco local da aplicação e listado no detalhe do pedido

### Cenário 6: Visualizar histórico de status
- **Given** pedido que passou por vários estados
- **When** usuário acessa detalhe do pedido
- **Then** timeline exibe cada transição: status anterior → novo status, data/hora

## API Contract

Backend endpoints (obrigatório):
- `POST /api/orders` — Criar pedido manual
- `GET /api/orders` — Listar com filtros e paginação
- `GET /api/orders/:id` — Detalhe com histórico de status
- `PATCH /api/orders/:id` — Atualizar pedido (bloqueado se status = shipping)
- `POST /api/orders/:id/status` — Mudar status (validar: não alterar cancelado)
- `POST /api/orders/:id/cancel` — Cancelar com motivo
- `POST /api/orders/:id/attachments` — Upload de arquivo (disco local)
- `DELETE /api/orders/:id/attachments/:fileId` — Remover arquivo
- `GET /api/orders/:id/history` — Histórico de mudanças de status

Documentar em `sdd-docs/api/orders.yaml`.

## Dependências

- Specs relacionadas: [0001-schema-banco-dados.md](0001-schema-banco-dados.md), [0009-customer-crud.md](0009-customer-crud.md), [0011-order-print-customer-linking.md](0011-order-print-customer-linking.md)
- Pacotes/serviços externos: nenhum (Prisma + MySQL + disco local via Node.js `fs`)
- ADRs relevantes: ADR a criar documentando armazenamento de arquivos em disco local

## Notas de Implementação

- **Decisões tomadas**:
  - Transições de status são livres — qualquer estado pode ir para qualquer outro, exceto pedido "cancelado" (terminal: sem saída).
  - Status "shipping" torna o pedido read-only (nenhum campo editável).
  - Storage de arquivos: disco local da aplicação (pasta configurável, ex.: `data/attachments/<orderId>/`).
  - Pedido tem dois valores financeiros: `salePrice` (preço cobrado do cliente) e `productionCost` (custo de produção estimado).
  - Sem roles — usuário único.
- **Camadas afetadas**:
  - Domain: `Order` entity, `OrderStatus` enum (`draft | scheduled | in_production | completed | shipping | cancelled`), `OrderStatusHistory` value object, `OrderRepository` interface
  - Application: `CreateOrderUseCase`, `UpdateOrderUseCase`, `ChangeOrderStatusUseCase` (validar: cancelado é terminal; shipping é read-only), `CancelOrderUseCase`, `AttachFileUseCase`
  - Infrastructure: Prisma `Order`, `OrderStatusHistory`, `OrderAttachment` models; file system service para disco local
  - Frontend: CRUD forms, lista filtrada, detalhe com timeline de status, upload de arquivos, seletor de cliente
- **Testes esperados**:
  - Unit: regras de transição (cancelado é terminal, shipping é read-only), validação de campos
  - Integration: CRUD completo, histórico imutável, upload/deleção de arquivo, transições válidas e inválidas
  - E2E: criar → alterar status → tentar editar em shipping (ver bloqueio) → cancelar → verificar histórico
- **Riscos**:
  - Arquivos em disco crescem sem controle — planejar cleanup futuro (fora do escopo desta spec)
  - Concorrência: dois usuários editando mesmo pedido (baixo risco dado que é sistema single-user)
  - Transição de cancelado: garantir que a regra "cancelado é terminal" esteja em domain layer, não só no controller
