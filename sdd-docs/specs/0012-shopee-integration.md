# Feature: Shopee Integration (Webhook + API)

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Integrar com a plataforma Shopee para receber pedidos automaticamente via webhook, sincronizar status de entrega e reagir a cancelamentos, reduzindo trabalho manual.

## Requisitos Funcionais

- [ ] RF1 — Autenticar com Shopee API usando token estático configurado em `.env` (sem OAuth)
- [ ] RF2 — Receber webhook de novo pedido Shopee e criar pedido interno automaticamente
- [ ] RF3 — Criar cliente automaticamente se o comprador Shopee ainda não existir no sistema
- [ ] RF4 — Receber webhook de cancelamento Shopee e mudar status do pedido interno para "cancelado"
- [ ] RF5 — Atualizar status de entrega na Shopee quando pedido interno muda para "shipping"
- [ ] RF6 — Registrar todos os webhooks recebidos como eventos auditáveis no banco
- [ ] RF7 — Sincronização manual de pedidos (catch-up) via endpoint acionado pelo usuário

## Requisitos Não-Funcionais

- [ ] RNF1 — Token Shopee armazenado exclusivamente em `.env`, nunca em código ou logs
- [ ] RNF2 — Validação HMAC de todo webhook recebido antes de qualquer processamento
- [ ] RNF3 — Idempotência: processar o mesmo webhook N vezes = resultado igual a 1 vez
- [ ] RNF4 — Processamento assíncrono via Bull + Redis (webhook responde 202 imediatamente)
- [ ] RNF5 — Retry automático com backoff exponencial (3 tentativas) para falhas de API Shopee
- [ ] RNF6 — Rate limit da API Shopee respeitado pela fila de jobs

## Critérios de Aceite

### Cenário 1: Novo pedido recebido via webhook
- **Given** comprador realiza pedido na Shopee
- **When** webhook de novo pedido chega com HMAC válido
- **Then** sistema retorna 202, enfileira processamento; cliente criado (se novo) e pedido criado com status "agendado"

### Cenário 2: Cancelamento recebido via webhook
- **Given** pedido Shopee é cancelado pelo comprador ou pela plataforma
- **When** webhook de cancelamento chega com HMAC válido
- **Then** pedido interno correspondente tem status alterado para "cancelado" com motivo "Cancelado via Shopee"

### Cenário 3: Pedido interno enviado → atualizar Shopee
- **Given** pedido importado da Shopee tem status alterado para "shipping"
- **When** status é salvo no sistema
- **Then** API Shopee é chamada para atualizar status de entrega; se falhar, retry automático é acionado

### Cenário 4: Webhook com HMAC inválido
- **Given** requisição sem assinatura ou com HMAC incorreto
- **When** sistema recebe o POST
- **Then** retorna 401, evento é descartado, nenhum processamento, log de segurança registrado

### Cenário 5: Deduplication
- **Given** mesmo webhook de pedido enviado duas vezes (shopee_order_id idêntico)
- **When** ambos são processados
- **Then** primeiro cria o pedido; segundo detecta duplicata e retorna 202 sem criar novamente

### Cenário 6: Falha após retries
- **Given** API Shopee está indisponível
- **When** 3 tentativas com backoff são esgotadas
- **Then** evento é marcado como "falha permanente" e fica disponível para reprocessamento manual

## API Contract

Backend endpoints (obrigatório):
- `POST /api/webhooks/shopee` — Receber webhooks da Shopee (validar HMAC, enfileirar)
- `POST /api/shopee/sync/orders` — Sincronização manual de pedidos (acionada pelo usuário)
- `GET /api/shopee/config` — Status da integração (token configurado? último sync? fila saudável?)
- `PATCH /api/shopee/config` — Ativar/desativar integração

Documentar em `sdd-docs/api/shopee-integration.yaml`.

## Dependências

- Specs relacionadas: [0009-customer-crud.md](0009-customer-crud.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0013-automatic-order-webhook-reception.md](0013-automatic-order-webhook-reception.md), [0014-shopee-order-data-mapping.md](0014-shopee-order-data-mapping.md)
- Pacotes/serviços externos:
  - Shopee Open API v2
  - Bull + Redis (job queue)
  - `crypto` nativo do Node.js (HMAC validation)
- ADRs relevantes: ADR a criar documentando escolha de Bull+Redis e token estático

## Notas de Implementação

- **Decisões tomadas**:
  - Autenticação: token estático no `.env` (`SHOPEE_PARTNER_ID`, `SHOPEE_PARTNER_KEY`). Sem OAuth.
  - Escopo: apenas pedidos (sem inventário, sem catálogo de produtos).
  - Cancelamento Shopee → webhook recebido → `CancelOrderUseCase` com motivo automático.
  - Job queue: Bull + Redis. Redis adiciona dependência de infraestrutura mas é necessário para retry confiável.
  - Idempotência por `shopee_order_id`: campo único na tabela de pedidos para impedir duplicatas.
  - Sem roles — usuário único.
- **Camadas afetadas**:
  - Domain: `ShopeeWebhookEvent` entity, `ShopeeOrderImport` aggregate, interfaces de adapter
  - Application: `ProcessShopeeWebhookUseCase`, `SyncShopeeOrdersUseCase`, `UpdateShopeeOrderStatusUseCase`, HMAC validator
  - Infrastructure: webhook HTTP receiver, Bull queue, Shopee API adapter, `WebhookEvent` repository
  - Frontend: painel de status da integração Shopee, logs de webhooks, botão de sync manual
- **Testes esperados**:
  - Unit: HMAC validation, deduplication check, mapeamento de status Shopee → interno
  - Integration: webhook receiver + DB + fila, retry logic, cancelamento em cascata
  - E2E: webhook chega → pedido criado → status muda para "shipping" → Shopee notificada
- **Riscos**:
  - Redis como dependência adicional de infraestrutura (Bull requer Redis)
  - Token Shopee expira? Verificar se token estático tem validade ou é permanente
  - Webhook replay: HMAC + idempotência por shopee_order_id como dupla proteção
