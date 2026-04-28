# Feature: Shopee Order Data Mapping

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar lógica de transformação de dados do webhook Shopee para o modelo interno de Order e Customer, com tratamento de campos ausentes, conversão de tipos e placeholders para campos que dependem de documentação futura da Shopee API.

## Requisitos Funcionais

- [ ] RF1 — Mapear dados básicos do pedido Shopee → Order interna (id, data, total em BRL)
- [ ] RF2 — Mapear dados do comprador Shopee → Customer interno (nome, email se disponível)
- [ ] RF3 — Mapear itens do pedido Shopee → descrição do pedido (texto livre, sem parsing de specs de impressão)
- [ ] RF4 — Aplicar defaults quando campos obrigatórios estão ausentes (ex.: email gerado automaticamente)
- [ ] RF5 — Converter status Shopee → status interno usando tabela de mapeamento (placeholder por enquanto)
- [ ] RF6 — Armazenar `shopee_order_id` e `shopee_shop_id` no pedido interno para rastreamento
- [ ] RF7 — Gerar número de pedido interno no formato `ORD-SHOPEE-<shopee_order_id>`
- [ ] RF8 — Registrar avisos de mapeamento (campos ausentes, defaults aplicados) no `WebhookEvent`

## Requisitos Não-Funcionais

- [ ] RNF1 — Mapeamento encapsulado em classe `ShopeeOrderMapper` — testável isoladamente
- [ ] RNF2 — Erro de mapeamento é registrado como aviso; não interrompe o fluxo se campo for opcional
- [ ] RNF3 — Campo obrigatório ausente (ex.: nome do comprador) resulta em erro que envia para retry
- [ ] RNF4 — Moeda: todos os valores monetários da Shopee são tratados em BRL

## Critérios de Aceite

### Cenário 1: Mapeamento completo de pedido válido
- **Given** webhook Shopee com todos os campos preenchidos
- **When** mapper é executado
- **Then** Order criada com: `orderNumber = "ORD-SHOPEE-<id>"`, `shopeeOrderId`, `shopeeShopId`, `description` (itens como texto), `totalAmount` em BRL, Customer com nome do comprador

### Cenário 2: Email ausente → default gerado
- **Given** payload Shopee sem email do comprador (campo não fornecido pela API)
- **When** mapper é executado
- **Then** Customer criado com email gerado: `shopee-<shopeeOrderId>@sem-email.local`; aviso registrado no WebhookEvent

### Cenário 3: Nome do comprador ausente → falha
- **Given** payload Shopee sem nome do comprador
- **When** mapper é executado
- **Then** erro lançado: "Nome do comprador obrigatório"; webhook enviado para retry

### Cenário 4: Status mapping com placeholder
- **Given** webhook Shopee com `order_status = "READY_TO_SHIP"`
- **When** mapper converte status
- **Then** status interno definido conforme tabela de mapeamento (tabela a ser preenchida com documentação Shopee)

### Cenário 5: Itens como texto livre
- **Given** pedido Shopee com 3 itens (SKU, nome, quantidade)
- **When** mapper processa os itens
- **Then** campo `description` da Order recebe lista de itens como texto (ex.: "3x Cartaz Personalizado, 1x Banner A0") — sem parsing de especificações de impressão

## API Contract

N/A — Feature é puramente camada application/domain (sem endpoint HTTP próprio).

## Dependências

- Specs relacionadas: [0010-manual-order-crud.md](0010-manual-order-crud.md), [0012-shopee-integration.md](0012-shopee-integration.md), [0013-automatic-order-webhook-reception.md](0013-automatic-order-webhook-reception.md)
- Pacotes/serviços externos: Zod (validação de schema do payload Shopee)
- ADRs relevantes: nenhum necessário

## Notas de Implementação

- **Decisões tomadas**:
  - Moeda: BRL. Shopee Brasil opera em reais; sem conversão necessária.
  - Descrição dos itens: texto livre concatenado — sem tentar extrair specs de impressão (papel, DPI, etc.) da descrição. Operador irá preencher manualmente se necessário.
  - Status mapping: **placeholder** — a tabela exata de `shopee_status_code → status_interno` será preenchida quando a documentação Shopee for revisada. Por enquanto, qualquer pedido novo é mapeado para "agendado".
  - Email: campo não obrigatório na Shopee API — gerar email sintético quando ausente.
  - `shopee_order_id`: campo único na tabela `Order` (unique constraint no banco).
  - Sem roles — usuário único.
- **Mapeamento de campos (rascunho — atualizar com documentação Shopee)**:

  | Campo Shopee            | Campo interno          | Tipo   | Default se ausente                        |
  |-------------------------|------------------------|--------|-------------------------------------------|
  | `ordersn`               | `shopeeOrderId`        | string | — (obrigatório, sem default)              |
  | `shop_id`               | `shopeeShopId`         | string | — (obrigatório, sem default)              |
  | `buyer_username`        | `customer.name`        | string | — (obrigatório, sem default)              |
  | `buyer_email`           | `customer.email`       | string | `shopee-<ordersn>@sem-email.local`        |
  | `total_amount`          | `order.totalAmount`    | number | — (obrigatório, sem default)              |
  | `item_list[].item_name` | `order.description`    | string | concatenação de todos os itens            |
  | `order_status`          | `order.status`         | enum   | "agendado" (placeholder — ver tabela)     |
  | `create_time`           | `order.createdAt`      | date   | timestamp de recebimento do webhook       |

- **Status mapping (placeholder — preencher com documentação Shopee)**:

  | Shopee status       | Status interno  |
  |---------------------|-----------------|
  | `UNPAID`            | `draft`         |
  | `READY_TO_SHIP`     | `scheduled`     |
  | `SHIPPED`           | `shipping`      |
  | `COMPLETED`         | `completed`     |
  | `CANCELLED`         | `cancelled`     |
  | outros              | `draft`         |

- **Camadas afetadas**:
  - Domain: `ShopeeOrderPayload` value object (Zod schema), `ShopeeStatusMapper`
  - Application: `ShopeeOrderMapper` (campos → Order + Customer), `ShopeeOrderValidator`
  - Infrastructure: Zod schema para validar payload bruto antes de mapear
- **Testes esperados**:
  - Unit: cada campo mapeado isoladamente (nome, email, status, itens), defaults aplicados corretamente
  - Unit: email gerado quando ausente, erro quando nome ausente
  - Integration: mapper completo com payload real Shopee (fixture) → Order/Customer criados corretamente
- **Riscos**:
  - Status mapping é placeholder — ao revisar documentação Shopee, atualizar a tabela e os testes correspondentes
  - Shopee pode mudar estrutura do payload sem aviso — Zod schema ajuda a detectar campos inesperados
