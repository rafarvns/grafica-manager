# Feature: Tela de Integração Shopee

> Status: `draft` · Autor: rafarvns · Data: 2026-04-27

## Contexto

Implementar a interface de gerenciamento da integração com Shopee: status de conexão, visualização de webhooks recebidos, sincronização manual de pedidos, log de erros com possibilidade de reprocessamento, e histórico de eventos. Esta tela permite ao operador monitorar e diagnosticar problemas com sincronização de pedidos via Shopee sem acessar logs do backend.

## Requisitos Funcionais

- [ ] RF1 — Tela `/shopee` com painel de integração Shopee
- [ ] RF2 — Painel de Status (seção superior):
  - [ ] RF2a — Status da conexão: "Ativo", "Inativo", "Erro de autenticação", "Token expirado"
  - [ ] RF2b — Data/hora do último webhook recebido
  - [ ] RF2c — Botão "Configurar Token" → modal com campo de token (mascarado)
  - [ ] RF2d — Botão "Sincronizar Agora" → dispara sync manual, mostra progresso
  - [ ] RF2e — Indicador de health: total de webhooks em fila, taxa de sucesso (%)
- [ ] RF3 — Tabela de Webhooks (histórico):
  - [ ] RF3a — Colunas: ID, timestamp, status (badge: processado/erro/pendente), evento (order created/updated), ID pedido Shopee, resultado (preview)
  - [ ] RF3b — Filtros: período (data início/fim), status (processado/erro/pendente), evento (select)
  - [ ] RF3c — Paginação (25 por página)
  - [ ] RF3d — Clique em linha → drawer com detalhes completos: payload JSON, timestamp, status, motivo se erro, tentativas de retry
- [ ] RF4 — Se status = "erro":
  - [ ] RF4a — Botão "Reprocessar" em linha falha (abre modal de confirmação)
  - [ ] RF4b — Modal: "Reprocessar webhook XXX?" com opção de aumentar verbosidade
  - [ ] RF4c — Ao confirmar, webhook volta à fila (status muda para "pendente"), notificação de sucesso
- [ ] RF5 — Log de Erros (abaixo da tabela ou aba):
  - [ ] RF5a — Listagem dos últimos 20 erros com: timestamp, tipo de erro, mensagem, webhook ID (link)
  - [ ] RF5b — Pode expandir erro para ver full stacktrace
  - [ ] RF5c — Botão "Limpar Log" com confirmação
- [ ] RF6 — Histórico de Sincronizações Manuais:
  - [ ] RF6a — Tabela com: data/hora, usuário que solicitou, pedidos processados, pedidos falhados, duração
  - [ ] RF6b — Clique em linha para expandir e ver resumo de pedidos
- [ ] RF7 — Notificações de status:
  - [ ] RF7a — Toast "Webhook reprocessado com sucesso"
  - [ ] RF7b — Toast "Sincronização iniciada, 45 pedidos para processar" (com progresso)
- [ ] RF8 — Responsividade: tabelas viram cards em <768px

## Requisitos Não-Funcionais

- [ ] RNF1 — Dados carregados via fetch assíncrono
- [ ] RNF2 — Histórico de webhooks atualiza a cada 5 segundos (polling leve, sem bloquear UI)
- [ ] RNF3 — Status de sync em tempo real (pode usar WebSocket se disponível, fallback polling)
- [ ] RNF4 — CSS Modules, sem styled-components
- [ ] RNF5 — Acessibilidade: tabelas com headers semânticos, modais com role="dialog"
- [ ] RNF6 — Tokens nunca são exibidos em full — sempre mascarados (últimos 4 caracteres visíveis)

## Critérios de Aceite

### Cenário 1: Abrir tela de integração Shopee
- **Given** usuário no layout principal
- **When** clica em "Integração Shopee" no menu
- **Then** navegação leva a `/shopee`, painel de status visível, tabela de webhooks carregada

### Cenário 2: Verificar status de conexão
- **Given** painel de status visível
- **When** usuário observa seção de status
- **Then** exibe: "Status: Ativo", "Último webhook: 2026-04-27 14:30", "Taxa de sucesso: 98%", "Webhooks em fila: 3"

### Cenário 3: Configurar token Shopee
- **Given** painel visível
- **When** clica "Configurar Token"
- **Then** modal abre com campo de token (vazio ou com placeholder "••••••••••••••••....abcd")
- **When** usuário cola token novo: "shp_xxxxxxxxxxxxxxxxxxxxx"
- **When** clica "Salvar"
- **Then** token é validado contra API Shopee, status atualiza, toast "Token configurado com sucesso" ou "Erro: Token inválido"

### Cenário 4: Sincronizar pedidos manualmente
- **Given** painel visível
- **When** clica "Sincronizar Agora"
- **Then** modal mostra: "Iniciando sincronização..." com spinner
- **Then** progresso atualiza: "Processando 1 de 45 pedidos..."
- **Then** após conclusão (ou erro), exibe: "✓ 45 pedidos sincronizados" ou "✗ 3 falharam, 42 sucesso"
- **Then** histórico de sincronização ganha nova entrada

### Cenário 5: Visualizar webhook com sucesso
- **Given** tabela de webhooks carregada
- **When** usuário clica em linha com status "processado"
- **Then** drawer abre com: ID, timestamp, status, evento ("order created"), ID pedido Shopee, preview do payload JSON
- **When** clica "Ver JSON Completo"
- **Then** modal exibe payload completo formatado

### Cenário 6: Reprocessar webhook com erro
- **Given** tabela com webhook em status "erro"
- **When** clica botão "Reprocessar"
- **Then** modal pede confirmação: "Reprocessar webhook [ID]? Será retentado 3 vezes com backoff."
- **When** usuário confirma
- **Then** webhook volta à fila (status muda para "pendente"), toast "Webhook reprocessado"
- **Then** tabela atualiza após alguns segundos (status muda para "processado" ou "erro" novamente)

### Cenário 7: Visualizar detalhes de erro
- **Given** drawer de webhook com status "erro" aberto
- **When** usuário observa seção de erro
- **Then** exibe: tipo de erro ("Validation Error"), mensagem ("Order ID not found"), tentativas (1/3), timestamp de última tentativa
- **When** clica "Ver Stacktrace Completo"
- **Then** modal exibe stacktrace técnico (para debug)

### Cenário 8: Filtrar webhooks por período
- **Given** tabela de webhooks
- **When** seleciona data início "2026-04-20", data fim "2026-04-27"
- **Then** tabela filtra, exibindo apenas webhooks do período

### Cenário 9: Filtrar por status de processamento
- **Given** tabela aberta
- **When** seleciona status "erro"
- **Then** tabela exibe apenas webhooks que falharam
- **Then** resumo atualiza: "Exibindo 3 de 128 webhooks (Erros do período)"

### Cenário 10: Visualizar log de erros
- **Given** seção de log aberta
- **When** usuário vê lista de 20 erros recentes
- **Then** cada erro exibe: timestamp, tipo (ex: "Connection Timeout"), mensagem resumida
- **When** clica em erro para expandir
- **Then** exibe: full message, stacktrace, webhook ID (link para detalhe)

## API Contract

Frontend consome endpoints dos specs 0012 (Shopee Integration), 0013 (Automatic Webhook Reception):
- `GET /api/shopee/status` — Status da conexão (ativo, erro, token válido)
- `POST /api/shopee/token` — Configurar token Shopee
- `POST /api/shopee/sync` — Sincronizar pedidos manualmente (enfileira job)
- `GET /api/webhooks` — Listar webhooks com filtros e paginação
- `GET /api/webhooks/:id` — Detalhe de um webhook
- `POST /api/webhooks/:id/reprocess` — Reprocessar webhook (enfileira retry)
- `GET /api/webhooks/errors` — Log de erros recentes
- `GET /api/shopee/sync-history` — Histórico de sincronizações manuais
- WebSocket `/ws/shopee-sync` (opcional) — Stream de progresso em tempo real (fallback polling)

Documentar em `sdd-docs/api/shopee.yaml`.

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md), [0012-shopee-integration.md](0012-shopee-integration.md), [0013-automatic-order-webhook-reception.md](0013-automatic-order-webhook-reception.md)
- Pacotes/serviços externos: nenhum (React nativo)
- ADRs relevantes: [0002-job-queue-bull-redis.md](0002-job-queue-bull-redis.md)

## Notas de Implementação

- **Arquitetura de componentes**:
  - `src/pages/ShopeeIntegration.tsx` — página principal
  - `src/components/domain/ShopeeStatusPanel.tsx` — painel de status e controles
  - `src/components/domain/WebhookTable.tsx` — tabela de webhooks com filtros e paginação
  - `src/components/domain/WebhookDetail.tsx` — drawer com detalhes de webhook
  - `src/components/domain/ErrorLogSection.tsx` — log de erros com expandable items
  - `src/components/domain/SyncHistoryTable.tsx` — histórico de sincronizações manuais
  - `src/components/domain/ConfigureTokenModal.tsx` — modal para configurar token
  - `src/components/domain/SyncProgressModal.tsx` — modal com progresso de sincronização
  - `src/hooks/useShopeeStatus.ts` — hook para fetch de status (polling 5s)
  - `src/hooks/useWebhookHistory.ts` — hook para fetch de webhooks
  - `src/services/shopeeService.ts` — wrapper para API Shopee

- **Estado da página**:
  ```typescript
  interface ShopeeIntegrationState {
    status: {
      isActive: boolean;
      tokenConfigured: boolean;
      lastWebhookTime?: Date;
      successRate: number; // 0-100
      queuedWebhooks: number;
      connectionError?: string;
    };
    
    webhooks: WebhookEvent[];
    webhooksLoading: boolean;
    webhooksPagination: { page: number; pageSize: number; totalCount: number };
    webhooksFilters: {
      startDate?: Date;
      endDate?: Date;
      status?: WebhookStatus; // 'pending' | 'processed' | 'error'
      eventType?: string;
    };
    
    errorLog: ErrorLogEntry[];
    errorLogLoading: boolean;
    
    syncHistory: SyncHistoryEntry[];
    syncHistoryLoading: boolean;
    
    modals: {
      configureToken?: boolean;
      syncProgress?: { active: boolean; progress: number; processed: number; total: number };
      webhookDetail?: string; // ID
    };
    
    reprocessingWebhookId?: string;
  }
  ```

- **Fluxo de dados**:
  1. Página `/shopee` monta, fetch GET de status
  2. ShopeeStatusPanel renderiza com indicadores
  3. Polling a cada 5s para atualizar status (webhooks em fila, sucesso rate)
  4. Tabela de WebhookTable carrega com paginação padrão
  5. Clique em linha → drawer abre (WebhookDetail)
  6. Se status = "erro", botão "Reprocessar" disponível
  7. Clique "Reprocessar" → modal de confirmação
  8. Confirmação → fetch POST, status muda para "pendente", polling detecta mudança
  9. Clique "Sincronizar Agora" → modal SyncProgressModal abre
  10. Backend enfileira job, emit eventos via WebSocket (ou polling a cada 1s)
  11. Progresso atualiza no modal, ao fim, webhook table refetch

- **Polling vs WebSocket**:
  - Status panel: polling GET /api/shopee/status a cada 5s
  - Webhooks table: fetch ao abrir page, depois polling a cada 10s OU WebSocket se disponível
  - Sync progress: polling GET /api/shopee/sync/:jobId a cada 1s durante progresso

- **Token masking**:
  - Sempre armazenar token completo no backend
  - Frontend exibe apenas: "••••••••••••••••....abcd" (últimos 4 chars visíveis)
  - Campo de input durante config tem visualização oculta (type="password" ou custom masking)
  - Nunca log token em console (remover antes de deploy)

- **CSS Modules**:
  - `ShopeeIntegration.module.css` — layout page com painéis
  - `ShopeeStatusPanel.module.css` — painel de status com cards de indicadores
  - `WebhookTable.module.css` — tabela com status badges
  - `ErrorLogSection.module.css` — log com expandable items
  - `SyncProgressModal.module.css` — modal com progress bar

- **Status badges** (cores):
  - `processed` → verde (sucesso)
  - `error` → vermelho (falhou)
  - `pending` → amarelo (aguardando)

- **Acessibilidade**:
  - Tabelas com `role="table"`, headers `scope="col"`
  - Modais com `role="dialog"` e focus trap
  - Status panel com `aria-live="polite"` (anúncia atualizações de status)
  - Botões "Reprocessar" com aria-label
  - Ícones de status com aria-label (não só cor)
  - Progress bar com `role="progressbar"`, aria-valuenow/valuemin/valuemax

- **Testes esperados**:
  - Unit: masking de token (últimos 4 chars visíveis)
  - Unit: cálculo de taxa de sucesso (processed / (processed + error))
  - Integration: fetch de webhooks com filtros (período, status)
  - Integration: reprocessar webhook, status atualiza, retorna à fila
  - Integration: sincronizar manualmente, job enfileira, progresso atualiza
  - Integration: configurar token, validação contra API Shopee
  - E2E: abrir `/shopee` → visualizar status → reprocessar webhook com erro → ver status atualizar
  - E2E: iniciar sincronização manual → acompanhar progresso → verificar novos pedidos
  - E2E: filtrar webhooks por período e status → tabela atualiza
  - E2E: visualizar log de erros → expandir erro → ver stacktrace

- **Riscos**:
  - Performance: 100k+ webhooks no histórico → paginação obrigatória com cursor-based
  - Token leak: se exibido em full em erro/log → sempre mascarar ou remover de logs antes de user
  - Sincronização longa: 10k+ pedidos Shopee → progress pode ficar travado se não atualizar 1s
  - Fallback polling: se WebSocket não disponível e polling 5s, usuário vê delay de até 5s em atualizações
  - Reprocessamento concorrente: 2 usuários reprocessam mesmo webhook simultaneamente → duplicação possível (mitigar com idempotência)

- **Implementação sugerida (ordem)**:
  1. Criar page `/shopee` com layout básico
  2. Criar hook `useShopeeStatus` com polling 5s
  3. Criar `ShopeeStatusPanel` com indicadores
  4. Criar `WebhookTable` com paginação
  5. Integrar filtros com fetch
  6. Criar `WebhookDetail` drawer
  7. Criar `ConfigureTokenModal` com masking
  8. Implementar reprocessar webhook
  9. Criar `SyncProgressModal` com polling 1s
  10. Criar `ErrorLogSection` com expandable items
  11. Criar `SyncHistoryTable`
  12. WebSocket ou fallback polling
  13. CSS, responsividade, acessibilidade
  14. Testes E2E completos

---

**Esta spec cobre o frontend de monitoramento e gerenciamento de 0012 (Shopee Integration) e 0013 (Automatic Webhook Reception).**
