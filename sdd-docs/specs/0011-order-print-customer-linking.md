# Feature: Order-Print-Customer Linking

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Estabelecer e gerenciar relacionamentos entre clientes, pedidos e impressões, permitindo rastreabilidade completa de cada trabalho desde o cliente até o resultado final, com atribuição de custos consolidados.

## Requisitos Funcionais

- [ ] RF1 — Vincular impressão a um pedido específico (1 pedido → N impressões)
- [ ] RF2 — Vincular pedido a um cliente (1 cliente → N pedidos)
- [ ] RF3 — Visualizar todas as impressões de um pedido com custo individual e total
- [ ] RF4 — Visualizar todos os pedidos de um cliente com custo acumulado
- [ ] RF5 — Calcular custo total do pedido: soma dos custos de impressão registrados no momento de cada impressão
- [ ] RF6 — Rastrear cadeia completa: cliente → pedido → impressões
- [ ] RF7 — Relatório consolidado por cliente (pedidos, impressões, custos, saldo)

## Requisitos Não-Funcionais

- [ ] RNF1 — Deleção de cliente bloqueada se houver pedidos ativos (não cancelados e não concluídos)
- [ ] RNF2 — Deleção de pedido bloqueada se houver impressões em andamento
- [ ] RNF3 — Queries com JOIN otimizadas (sem N+1) para exibir cadeia completa
- [ ] RNF4 — Custo de impressão congelado no momento do registro — agregação soma valores históricos imutáveis

## Critérios de Aceite

### Cenário 1: Criar impressão vinculada a pedido
- **Given** pedido "ORD-001" do cliente "João" existe
- **When** usuário cria impressão e seleciona "Vincular a Pedido ORD-001"
- **Then** impressão criada com `orderId` referenciando o pedido

### Cenário 2: Custo total do pedido
- **Given** pedido "ORD-001" tem 3 impressões com custos R$ 1,20 / R$ 3,00 / R$ 0,90
- **When** usuário acessa detalhe do pedido
- **Then** exibe: custo de impressões = R$ 5,10 (soma imutável dos snapshots)

### Cenário 3: Visualizar pedidos de um cliente
- **Given** cliente "João" tem 5 pedidos com impressões
- **When** usuário acessa perfil do cliente
- **Then** lista exibe: número do pedido, data, status, custo total por pedido, custo acumulado do cliente

### Cenário 4: Bloquear deleção de cliente com pedidos ativos
- **Given** cliente "Maria" tem pedido em status "em produção"
- **When** usuário tenta deletar o cliente
- **Then** erro: "Cliente possui pedidos ativos. Conclua ou cancele antes de deletar."

### Cenário 5: Rastrear cadeia completa
- **Given** impressão específica
- **When** usuário clica "Ver origem"
- **Then** exibe breadcrumb: Impressão → Pedido (ORD-001) → Cliente (João)

### Cenário 6: Relatório por cliente
- **Given** cliente "Ana" tem pedidos e impressões no mês
- **When** usuário gera relatório mensal de "Ana"
- **Then** relatório exibe: pedidos (quantidade, status, valores), impressões (quantidade, custo), margem (salePrice − custo total)

## API Contract

Backend endpoints (obrigatório):
- `POST /api/orders/:orderId/print-jobs` — Criar impressão vinculada ao pedido
- `GET /api/orders/:orderId/print-jobs` — Listar impressões do pedido com custos
- `GET /api/customers/:customerId/orders` — Listar pedidos do cliente com resumo de custo
- `GET /api/customers/:customerId/reports/summary` — Relatório consolidado do cliente

Documentar em `sdd-docs/api/relationships.yaml`.

## Dependências

- Specs relacionadas: [0008-print-recording-accounting.md](0008-print-recording-accounting.md), [0009-customer-crud.md](0009-customer-crud.md), [0010-manual-order-crud.md](0010-manual-order-crud.md)
- Pacotes/serviços externos: nenhum (Prisma + MySQL com foreign keys)
- ADRs relevantes: ADR a criar documentando estratégia de aggregation de custos

## Notas de Implementação

- **Decisões tomadas**:
  - Deleção bloqueada (Opção A): cliente com pedidos ativos não pode ser deletado; pedido com impressões em andamento não pode ser deletado.
  - Custo agregado é soma dos snapshots imutáveis registrados em cada `PrintJob` — nunca recalculado.
  - Cascata de soft-delete: ao deletar cliente (sem pedidos ativos), apenas o cliente recebe soft-delete; pedidos concluídos/cancelados permanecem para histórico.
  - Sem roles — usuário único.
- **Camadas afetadas**:
  - Domain: regras de integridade referencial em `Customer` e `Order` entities; `CostAggregator` value object
  - Application: `GetOrderCostSummaryUseCase`, `GetCustomerSummaryUseCase`, validação de deleção com checagem de pedidos
  - Infrastructure: Prisma relations com FK (`Order.customerId`, `PrintJob.orderId`), índices compostos, queries com aggregate (`SUM`, `COUNT`)
  - Frontend: detalhe do pedido com seção de impressões e custo total; perfil do cliente com lista de pedidos e custo acumulado
- **Testes esperados**:
  - Unit: cálculo de custo total (soma de snapshots), regra de bloqueio de deleção
  - Integration: FK enforcement no banco, aggregate queries com JOIN, bloqueio de deleção com pedidos ativos
  - E2E: criar cliente → criar pedido → registrar impressões → visualizar custo total → tentar deletar cliente com pedido ativo
- **Riscos**:
  - Queries com JOIN e SUM podem ser lentas sem índices em `order_id` e `created_at`
  - Orfandade: `PrintJob` sem `Order`, `Order` sem `Customer` — FK no banco como última linha de defesa
