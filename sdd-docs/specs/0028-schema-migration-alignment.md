# Feature: Schema Migration — Alinhamento de Specs (CRÍTICO)

> Status: `ready` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Alinhar o schema Prisma atual com os specs 0006–0016 que foram finalizados. O schema tinha divergências críticas (OrderStatus enum incompatível, modelos faltando) que bloqueavam toda a implementação.

## Mudanças Aplicadas

### 1. Corrigir OrderStatus Enum

**ANTES (incompatível com specs):**
```
RECEIVED, IN_PRODUCTION, PRODUCTION_DONE, PACKAGED, SHIPPED, DELIVERED
```

**DEPOIS (alinhado com specs 0010/0012):**
```
draft           // Pedido em rascunho
scheduled       // Pedido agendado para produção
in_production   // Pedido em produção
completed       // Produção concluída
shipping        // Pedido enviado (read-only)
cancelled       // Pedido cancelado (terminal)
```

**Mudanças em dados existentes:**
Se houver pedidos já criados, mapear statuses:
- `RECEIVED` → `scheduled`
- `IN_PRODUCTION` → `in_production`
- `PRODUCTION_DONE` → `completed`
- `PACKAGED` → `shipping`
- `SHIPPED` → `shipping`
- `DELIVERED` → `completed`

### 2. Adicionar Novo Enum WebhookStatus

Para spec 0013 (Automatic Webhook Reception):
```
pending      // Aguardando processamento
processed    // Processado com sucesso
error        // Erro (será retentado)
discarded    // Descartado (duplicata, inválido)
failed       // Falha permanente após retries
```

### 3. Adicionar Modelo PaperType

**Spec:** 0007 (Print Parameters Configuration)

```prisma
model PaperType {
  id        String @id @default(uuid())
  name      String
  gsm       Int?   // Gramatura em g/m²
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  printPresets PrintPreset[]
  printJobs    PrintJob[]
}
```

**Raciocínio:** Tipos de papel são cadastráveis pelo usuário (spec 0007 RNF2); precisam de persistência no banco.

### 4. Adicionar Modelo PriceTableEntry

**Spec:** 0008 (Print Recording and Accounting)

```prisma
model PriceTableEntry {
  id              String @id @default(uuid())
  name            String   // ex: "Sulfite A4 PB Econômico"
  description     String?
  pricePerUnit    Decimal  // Preço unitário
  unit            String?  // "por página", "por impressão" (informativo)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Raciocínio:** Tabela de preços unitários é cadastrada pelo usuário e deve ser imutável para auditoria.

### 5. Adicionar Modelo WebhookEvent

**Spec:** 0013 (Automatic Webhook Reception)

```prisma
model WebhookEvent {
  id              String @id @default(uuid())
  source          String         // "shopee", "mercado_livre"
  externalId      String         // Chave de deduplicação
  status          WebhookStatus  @default(pending)
  payload         Json           // Payload original (imutável)
  mappingWarnings String?        // Avisos de mapeamento JSON
  attempt         Int            @default(0)
  lastError       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  orderId String?
  order   Order?  @relation(fields: [orderId], references: [id])

  @@unique([source, externalId])
}
```

**Raciocínio:** Rastrear todos os webhooks recebidos, com idempotência por `source+externalId`.

### 6. Adicionar Modelo OrderStatusHistory

**Spec:** 0010 (Manual Order CRUD)

```prisma
model OrderStatusHistory {
  id        String @id @default(uuid())
  orderId   String
  fromStatus String?
  toStatus   String
  reason     String?
  createdAt DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}
```

**Raciocínio:** Histórico imutável de transições de status para auditoria (spec 0010 RNF3).

### 7. Atualizar Modelo PrintPreset

**Relação com PaperType:**
Adicionar FK `paperTypeId` (opcional, com fallback para string `paperType`).

### 8. Atualizar Modelo PrintJob

**Mudanças:**
- Renomear `estimatedCost` → `registeredCost` (congelado no momento, spec 0008)
- Adicionar `status` (success, error, cancelled) — diferente de Order.status
- Adicionar `errorMessage` para troubleshooting
- Adicionar `paperTypeId` com FK para PaperType
- Adicionar `registeredCost` (Decimal, imutável, snapshot da tabela de preços no momento da impressão)

### 9. Atualizar Modelo Order

**Mudanças:**
- Adicionar `orderNumber` (String @unique) — ex: "ORD-001", "ORD-SHOPEE-12345"
- Renomear `externalOrderId` e adicionar `shopeeOrderId` @unique (deduplication key para Shopee)
- Adicionar `shopeeShopId` (para rastreamento Shopee)
- Adicionar `salePrice` (Decimal — preço de venda) e `productionCost` (Decimal — custo estimado)
- Adicionar relações: `statusHistory: OrderStatusHistory[]`, `webhookEvents: WebhookEvent[]`
- Adicionar índices em `createdAt` (para queries por período)

### 10. Atualizar Modelo Customer

**Mudanças:**
- `email` agora é `@unique` (spec 0009 RNF1)
- Adicionar índice em `deletedAt` para queries soft-delete
- Adicionar relação `webhookEvents: WebhookEvent[]` (para webhooks Shopee)

### 11. Adicionar Cascata de Deleção

Onde relevante:
- `OrderStatusHistory` é deletado ao deletar `Order` (@relation(..., onDelete: Cascade))
- `OrderFile` é deletado ao deletar `Order` (@relation(..., onDelete: Cascade))

## Procedimento de Migração

### Para novo banco (desenvolvimento fresh):
```bash
npx prisma migrate dev --name initial-schema
```

### Para banco existente com dados:
```bash
# 1. Backup do banco antes de qualquer mudança
mysqldump grafica_manager > backup_$(date +%s).sql

# 2. Criar migração manual se houver dados a preservar
npx prisma migrate dev --name align-schema-with-specs

# 3. Se houver divergências, editar o arquivo SQL gerado manualmente
# (ex: mapear RECEIVED → scheduled, etc.)

# 4. Executar migração
npx prisma migrate resolve --applied <migration-name>
```

## Impacto nas Specs

**Specs desbloqueadas por esta mudança:**
- 0007 — PrintPreset agora pode referenciar PaperType
- 0008 — PriceTableEntry agora existe no schema
- 0010 — OrderStatusHistory agora existe; Order.orderNumber é campo único
- 0011 — Relações customer-order-printjob agora estão bem definidas
- 0012 — shopeeOrderId como unique key para deduplication
- 0013 — WebhookEvent agora existe no schema
- 0014 — Mapeamento Shopee tem lugar para armazenar warnings

## Testes

Antes de mergear:
- [ ] Schema valida com `npx prisma validate`
- [ ] Geração de client OK com `npx prisma generate`
- [ ] Se banco existente: backup feito e testado
- [ ] Migração executada sem erro
- [ ] Dados mapeados corretamente (se houver)

## Observações Importantes

- **Idempotência de webhooks:** `WebhookEvent.unique([source, externalId])` garante que mesmo webhook 100x = entrada 1x no banco.
- **Imutabilidade de custos:** `PrintJob.registeredCost` é snapshot congelado; nunca recalcular retroativamente.
- **Soft-delete:** `Customer.deletedAt` e `Order.deletedAt` — queries deve sempre filtrar `WHERE deletedAt IS NULL` (confiar em application layer).
- **OrderStatusHistory:** Não está em cascade de atualização — cada transição é um novo registro (append-only).

---

**Esta spec é pré-requisito para toda a implementação dos specs 0006–0016.**
