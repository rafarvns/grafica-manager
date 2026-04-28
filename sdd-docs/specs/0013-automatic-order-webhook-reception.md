# Feature: Automatic Order Webhook Reception

> Status: `implemented` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a infraestrutura genérica de recebimento, validação, enfileiramento e processamento de webhooks de pedidos. O MVP suporta apenas Shopee; a arquitetura deve ser extensível para outras plataformas sem refactor.

## Requisitos Funcionais

- [x] RF1 — Receber webhook de pedido via HTTP POST com identificação da plataforma de origem
- [x] RF2 — Validar assinatura HMAC antes de qualquer processamento (rejeitar se inválida)
- [x] RF3 — Responder 202 imediatamente e enfileirar processamento em background (Bull + Redis)
- [x] RF4 — Deduplicar por `shopee_order_id` (MVP Shopee) — mesmo ID nunca gera dois pedidos
- [x] RF5 — Transformar payload da plataforma para modelo interno (Order, Customer)
- [x] RF6 — Criar cliente automaticamente se não existir
- [x] RF7 — Criar pedido vinculado ao cliente
- [x] RF8 — Persistir payload original do webhook para auditoria (imutável)
- [x] RF9 — Registrar status de cada webhook: pendente, processado, erro, descartado
- [x] RF10 — Retry automático com backoff exponencial (3 tentativas) em caso de erro transitório
- [x] RF11 — Marcar como "falha permanente" após esgotar tentativas; disponibilizar para reprocessamento manual

## Requisitos Não-Funcionais

- [x] RNF1 — Validação HMAC obrigatória (sem exceções); rejeitar qualquer webhook sem assinatura válida
- [x] RNF2 — Idempotência garantida: processar mesmo webhook 100x = resultado igual a 1x
- [x] RNF3 — Webhook responde em < 500ms (apenas valida HMAC e enfileira)
- [x] RNF4 — Payload original persistido em coluna JSON (auditoria completa)
- [x] RNF5 — Retry com backoff: 30s → 5min → 30min
- [x] RNF6 — Processar 1000 webhooks/dia sem degradação (Bull + Redis suporta com folga)

## Critérios de Aceite

### Cenário 1: Webhook válido processado com sucesso
- **Given** webhook de novo pedido Shopee com HMAC válido
- **When** POST chega em `/api/webhooks/orders`
- **Then** retorna 202, job enfileirado, cliente e pedido criados em background, status = "processado"

### Cenário 2: Webhook com HMAC inválido
- **Given** POST sem header de assinatura ou HMAC incorreto
- **When** sistema recebe
- **Then** retorna 401, payload descartado, log de segurança registrado, status = "descartado"

### Cenário 3: Deduplication por ID único
- **Given** webhook com `shopee_order_id = 12345` já processado com sucesso
- **When** mesmo webhook chega novamente
- **Then** sistema detecta duplicata, retorna 202, nenhum pedido criado, status = "descartado (duplicata)"

### Cenário 4: Erro transitório + Retry
- **Given** banco de dados indisponível durante processamento
- **When** job falha na primeira tentativa
- **Then** job é re-enfileirado após 30s, depois 5min, depois 30min; se BD voltar, processa com sucesso

### Cenário 5: Falha permanente
- **Given** payload com dados inválidos (ex.: cliente sem nome)
- **When** 3 tentativas são esgotadas
- **Then** webhook marcado como "falha permanente", disponível para análise e reprocessamento manual

### Cenário 6: Reprocessamento manual
- **Given** webhook em "falha permanente"
- **When** usuário clica "Reprocessar"
- **Then** job é re-enfileirado e tentado novamente

## API Contract

Backend endpoints (obrigatório):
- `POST /api/webhooks/orders` — Receber webhook (validar HMAC, enfileirar, 202)
- `GET /api/webhooks/orders` — Listar webhooks com status e filtros (plataforma, status, período)
- `GET /api/webhooks/orders/:id` — Detalhe: payload original, tentativas, erros
- `POST /api/webhooks/orders/:id/retry` — Reprocessar manualmente
- `POST /api/webhooks/orders/:id/dismiss` — Descartar definitivamente

Documentar em `sdd-docs/api/webhooks.yaml`.

## Dependências

- Specs relacionadas: [0009-customer-crud.md](0009-customer-crud.md), [0010-manual-order-crud.md](0010-manual-order-crud.md), [0012-shopee-integration.md](0012-shopee-integration.md), [0014-shopee-order-data-mapping.md](0014-shopee-order-data-mapping.md)
- Pacotes/serviços externos:
  - Bull + Redis (job queue e retry)
  - `crypto` nativo Node.js (HMAC)
- ADRs relevantes: ADR a criar documentando Bull+Redis como job queue

## Notas de Implementação

- **Decisões tomadas**:
  - MVP: apenas Shopee. Arquitetura usa interface `WebhookProcessor` com implementação `ShopeeWebhookProcessor`; adicionar ML futuramente é só criar nova implementação.
  - Deduplication key: `shopee_order_id` (campo único na tabela `WebhookEvent`).
  - Job queue: Bull + Redis (mesma escolha da spec 0012).
  - Payload original salvo em coluna `JSON` no banco (imutável, apenas para leitura/auditoria).
  - Retry: 3 tentativas com backoff 30s → 5min → 30min.
  - Sem roles — usuário único.
- **Camadas afetadas**:
  - Domain: `WebhookEvent` entity (imutável após criação), `WebhookStatus` enum, `WebhookProcessor` interface
  - Application: `ReceiveWebhookUseCase` (HMAC + enqueue), `ProcessWebhookJobUseCase` (transform + create), deduplication logic
  - Infrastructure: HTTP controller (somente valida HMAC e enfileira), Bull queue, `WebhookEvent` Prisma model, `ShopeeWebhookProcessor` adapter
  - Frontend: painel de webhooks (tabela com status, payload, tentativas), botão de retry/dismiss
- **Testes esperados**:
  - Unit: HMAC validation, deduplication check, transform payload → Order/Customer
  - Integration: webhook receiver → DB (payload salvo), Bull queue, retry mechanism
  - E2E: POST webhook → 202 → job processa → pedido criado → visível no painel de webhooks
- **Riscos**:
  - Redis como dependência de infraestrutura — avaliar se isso é viável no ambiente de produção do usuário
  - Falha silenciosa: webhook aceito mas job falha em background — painel de webhooks é essencial para visibilidade
  - Transações: `CREATE customer` + `CREATE order` deve ser atômico (rollback se order falhar)
