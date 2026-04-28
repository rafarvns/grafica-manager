# Feature: Notificações In-App (Toast + Painel)

> Status: `concluded` · Autor: rafarvns · Data: 2026-04-28

## Contexto

Implementar sistema de notificações com dois níveis: (1) **Toasts**: mensagens efêmeras (sucesso, aviso, erro) que desaparecem após 3–5s; (2) **Painel**: notificações persistentes para eventos críticos que requerem atenção (webhook recorrentemente falhando, pedido urgente vencendo prazo, impressora desconectada) que ficam até o usuário dispensar. Notificações críticas persistem no banco e são carregadas ao iniciar a app.

## Requisitos Funcionais

- [ ] RF1 — Toast Context global (spec 0017 — Layout) para mensagens efêmeras
  - [ ] RF1a — `addToast(message, type, duration)` onde type = 'success' | 'error' | 'warning' | 'info'
  - [ ] RF1b — Toast aparece canto inferior direito, desaparece após 3–5s (ou close manual)
  - [ ] RF1c — Máximo 3 toasts simultâneos, fila silenciosa (anteriores escondem)
  - [ ] RF1d — Ícone e cor conforme tipo (✓ verde, ✗ vermelho, ⚠ amarelo, ℹ azul)

- [ ] RF2 — Notification Panel (persistente):
  - [ ] RF2a — Ícone no header exibindo count de notificações não lidas
  - [ ] RF2b — Clique abre drawer/modal com lista de notificações
  - [ ] RF2c — Cada notificação exibe: título, descrição, timestamp, tipo de evento, status (lido/não lido)
  - [ ] RF2d — Notificações críticas com badge vermelho, outras com badge cinza
  - [ ] RF2e — Botão "Marcar como lido" por notificação ou "Marcar tudo como lido"
  - [ ] RF2f — Botão "Dispensar" remove notificação (soft-delete)
  - [ ] RF2g — Botões de ação contextuais (ex: "Ver webhook" leva a `/shopee`, "Ver pedido" leva a `/orders/:id`)

- [ ] RF3 — Tipos de notificações críticas:
  - [ ] RF3a — "Webhook falhou repetidamente": mensagem "Webhook XXX falhou 3 vezes. Clique para reprocessar." (Ação: reprocessar)
  - [ ] RF3b — "Pedido vencendo prazo": "Pedido ORD-001 vence em 2 dias" (Ação: abrir pedido)
  - [ ] RF3c — "Impressora desconectada": "Impressora HP falhou. Verifique conexão." (Ação: abrir detalhes)
  - [ ] RF3d — "Sincronização Shopee falhou": "Última sincronização falhou. 5 webhooks em fila." (Ação: ir para Shopee)
  - [ ] RF3e — "Sistema de arquivo cheio": "Espaço em disco baixo (<100MB)." (Ação: limpar)

- [ ] RF4 — Persistência de notificações críticas:
  - [ ] RF4a — Modelo `Notification` no banco (id, title, description, type, category, read, dismissedAt, createdAt, orderId?, webhookId?)
  - [ ] RF4b — Notificações são carregadas ao inicializar app (GET `/api/notifications`)
  - [ ] RF4c — Notificações antigas (> 30 dias) são auto-deletadas via cron job
  - [ ] RF4d — Quando usuário dispensa, registra `dismissedAt` (soft-delete, não apaga)

- [ ] RF5 — Emissão de notificações:
  - [ ] RF5a — Backend gera notificações em eventos críticos (via Observer pattern, specs 0013, 0023)
  - [ ] RF5b — Frontend pode chamar API para criar notificação (futuro: autenticação)
  - [ ] RF5c — Notificações enviadas em tempo real via WebSocket (ou polling a cada 10s como fallback)

- [ ] RF6 — Comportamento por evento:
  - [ ] RF6a — Toast: "Pedido criado com sucesso" → desaparece 3s
  - [ ] RF6b — Painel crítico: "Webhook falhou 3x" → fica até usuário dispensar ou reprocessar com sucesso
  - [ ] RF6c — Toast + Painel: "Sincronização iniciada" (toast) + "Sincronização completada com 2 erros" (painel crítica)

## Requisitos Não-Funcionais

- [ ] RNF1 — Toast tem máximo 3 simultâneos, queue de escrita para posteriores
- [ ] RNF2 — Notificações críticas (painel) carregadas ao startup e sincronizadas em tempo real via WebSocket
- [ ] RNF3 — Notificações antigas (> 30 dias) são garbage collected via cron job (não mantém histórico de meses)
- [ ] RNF4 — Sem polução visual: não exibir toast para events menores (ex: hover, blur)
- [ ] RNF5 — Acessibilidade: notificações com `role="alert"` para screen readers

## Critérios de Aceite

### Cenário 1: Toast de sucesso
- **Given** usuário cria novo cliente
- **When** formulário é enviado com sucesso
- **Then** toast aparece canto inferior direito: "✓ Cliente criado com sucesso" (verde)
- **Then** toast desaparece após 3 segundos

### Cenário 2: Toast de erro
- **Given** usuário tenta fazer upload de arquivo > 10MB
- **When** clica "Upload"
- **Then** toast aparece: "✗ Arquivo muito grande (máx 10MB)" (vermelho)
- **Then** desaparece após 5 segundos

### Cenário 3: Múltiplos toasts simultâneos
- **Given** 3 operações simultâneas (criar cliente, editar pedido, upload arquivo)
- **When** 3 toasts disparam
- **Then** máximo 3 visíveis de uma vez, sobrepostos ou stackados
- **When** primeiro desaparece
- **Then** 4º toast (se houver na fila) aparece

### Cenário 4: Abrir painel de notificações
- **Given** header visível com ícone de notificação
- **WHEN** ícone exibe badge "3" (3 não lidas)
- **When** clica no ícone
- **Then** drawer abre mostrando 3 notificações listadas

### Cenário 5: Notificação crítica — webhook falhou
- **Given** webhook tentou processar pedido 3x e falhou
- **When** 3ª tentativa falha
- **Then** Toast: "⚠ Webhook falhou, consulte painel" (amarelo, 5s)
- **Then** Notificação crítica é criada no painel: "Webhook XXX falhou 3 vezes"
- **Then** ícone no header exibe badge vermelho
- **When** usuário abre painel
- **Then** notificação aparece com badge vermelho, descrição, botão "Reprocessar"

### Cenário 6: Marcar notificação como lida
- **Given** painel aberto com 3 notificações não lidas
- **When** usuário clica em uma notificação
- **Then** notificação é marcada como lida (opacity reduzida, badge desaparece)
- **Then** count no header muda de "3" para "2"

### Cenário 7: Dispensar notificação
- **Given** notificação crítica no painel
- **When** usuário clica botão "X" ou "Dispensar"
- **Then** notificação é removida da lista
- **Then** é soft-deletada (registra `dismissedAt`)
- **Then** não reaparece ao reabrir painel (mas fica no histórico do banco)

### Cenário 8: Ação contextual — webhook
- **Given** notificação crítica: "Webhook XXX falhou 3 vezes"
- **When** clica botão "Reprocessar"
- **Then** webhook é reenviado à fila
- **When** reprocessamento tem sucesso
- **Then** notificação é auto-dispensada (ou muda status)
- **Then** toast: "✓ Webhook reprocessado com sucesso"

### Cenário 9: Ação contextual — pedido vencendo
- **Given** notificação crítica: "Pedido ORD-001 vence em 2 dias"
- **When** clica botão "Ver Pedido"
- **Then** navegação leva a `/orders/ORD-001` (detalhe do pedido)
- **Then** painel fecha

### Cenário 10: Carga de notificações ao iniciar
- **Given** aplicação é reiniciada
- **When** componente de layout monta
- **Then** fetch GET `/api/notifications?dismissed=false` carrega notificações não dispensadas
- **Then** ícone no header exibe count correto
- **Then** painel pode ser aberto com notificações pré-carregadas

## API Contract

Backend expõe:
- `GET /api/notifications` — Listar não dispensadas (query param `dismissed=true/false`)
- `PATCH /api/notifications/:id/read` — Marcar como lido
- `PATCH /api/notifications/:id/dismiss` — Soft-delete
- `POST /api/notifications` — Criar notificação (futuro: apenas backend)
- WebSocket `/ws/notifications` (opcional) — Stream de notificações em tempo real

Documentar em `sdd-docs/api/notifications.yaml`.

## Dependências

- Specs relacionadas: [0017-main-layout-navigation.md](0017-main-layout-navigation.md) (Toast context), [0013-automatic-order-webhook-reception.md](0013-automatic-order-webhook-reception.md) (gera notificações de erro), [0023-shopee-integration-screen.md](0023-shopee-integration-screen.md) (consome notificações)
- Pacotes/serviços externos: nenhum
- ADRs relevantes: [0002-job-queue-bull-redis.md](0002-job-queue-bull-redis.md) (cron para cleanup)

## Notas de Implementação

- **Domain Layer**:
  - `src/domain/entities/Notification.ts` — Value Object
  - `src/domain/repositories/NotificationRepository.ts` — Interface

- **Application Layer**:
  - `src/application/use-cases/GetNotificationsUseCase.ts`
  - `src/application/use-cases/MarkNotificationAsReadUseCase.ts`
  - `src/application/use-cases/DismissNotificationUseCase.ts`
  - `src/application/use-cases/CreateNotificationUseCase.ts`

- **Infrastructure Layer**:
  - `src/infrastructure/database/repositories/PrismaNotificationRepository.ts`
  - `src/infrastructure/http/controllers/NotificationController.ts`
  - `src/infrastructure/http/routes/notifications.ts`
  - `src/infrastructure/jobs/NotificationCleanupJob.ts` — cron job para deletar > 30 dias

- **Frontend Layer**:
  - `src/contexts/NotificationContext.tsx` — já existe (spec 0017), melhorar para suportar painel
  - `src/components/ui/Toast.tsx` — melhorar (limite 3, ícones, cores)
  - `src/components/ui/NotificationPanel.tsx` — novo drawer/modal com lista
  - `src/components/ui/NotificationIcon.tsx` — ícone com badge no header
  - `src/hooks/useNotifications.ts` — fetch e polling de notificações
  - `src/hooks/useToast.ts` — adicionar toast (já existe do context)

- **Schema Prisma**:
  ```prisma
  model Notification {
    id String @id @default(uuid())
    title String
    description String
    type String // 'webhook_failed' | 'order_deadline' | 'printer_offline' | 'shopee_sync_failed' | 'disk_full'
    category String // 'critical' | 'warning' | 'info'
    read Boolean @default(false)
    dismissedAt DateTime?
    
    // Links opcionais para contexto
    orderId String?
    order Order? @relation(fields: [orderId], references: [id])
    webhookId String?
    
    actionUrl String? // ex: '/shopee' ou '/orders/ORD-001'
    actionLabel String? // ex: 'Reprocessar' ou 'Ver Pedido'
    
    createdAt DateTime @default(now())
    
    @@index([read])
    @@index([dismissedAt])
    @@index([createdAt])
  }
  ```

- **Toast Context** (melhorado):
  ```typescript
  // src/contexts/NotificationContext.tsx
  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
  }
  
  const MAX_SIMULTANEOUS_TOASTS = 3;
  
  const NotificationContext = createContext<{
    toasts: Toast[];
    addToast: (msg: string, type: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
  }>(null);
  
  // Use case: queuear toasts se > 3
  export function useToast() {
    const { toasts, addToast, removeToast } = useContext(NotificationContext);
    
    return {
      success: (msg: string) => addToast(msg, 'success', 3000),
      error: (msg: string) => addToast(msg, 'error', 5000),
      warning: (msg: string) => addToast(msg, 'warning', 4000),
      info: (msg: string) => addToast(msg, 'info', 3000)
    };
  }
  ```

- **Painel de Notificações** (novo componente):
  ```typescript
  // src/components/ui/NotificationPanel.tsx
  export function NotificationPanel() {
    const { notifications, loading, markAsRead, dismiss } = useNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    
    return (
      <>
        <button onClick={() => setOpen(!open)} className={styles.iconButton}>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          🔔
        </button>
        {open && (
          <Drawer>
            <div className={styles.notificationList}>
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onAction={handleAction}
                  onDismiss={() => dismiss(n.id)}
                />
              ))}
            </div>
          </Drawer>
        )}
      </>
    );
  }
  ```

- **Emissão de notificações** (Observer pattern):
  - Quando webhook falha 3x: `notificationService.create('webhook_failed', ...)`
  - Quando pedido vence prazo: cron job checkeia e cria notificação
  - Quando impressora offline: sistema detecta e cria notificação
  - Backend envia via WebSocket ou frontend faz polling GET `/api/notifications`

- **CSS Modules**:
  - `Toast.module.css` — estilos de toast (posição, animação fade-in/out)
  - `NotificationPanel.module.css` — drawer com lista de notificações
  - `NotificationItem.module.css` — item individual com badge, descrição, botões

- **Acessibilidade**:
  - Toasts e notificações com `role="alert"` ou `role="status"`
  - Ícone com `aria-label="X notificações não lidas"`
  - Botões de ação com aria-label
  - Drawer com focus trap (tabbing não sai do drawer)

- **Testes esperados**:
  - Unit: enfileiramento de toasts (máximo 3)
  - Unit: cálculo de count de não lidas
  - Unit: soft-delete de notificação
  - Integration: criar notificação crítica, aparece no painel
  - Integration: marcar como lido, badge desaparece
  - Integration: dispensar, notificação sai da lista
  - Integration: cron job deleta notificações > 30 dias
  - E2E: webhook falha → toast + notificação painel → reprocessar → auto-dispensa
  - E2E: pedido vence → notificação painel → clica "Ver Pedido" → navega

- **Riscos**:
  - Spam de notificações: se muitos eventos críticos simultâneos → limitar com debounce ou aggregation
  - Persistência perdida: se banco cai antes de salvar notificação → queue local no Redis como fallback
  - Notificações antigas acumuladas: > 30 dias devem ser deletadas (cron job)
  - Toast overlap: > 3 simultâneos devem fila (implementado com MAX_SIMULTANEOUS_TOASTS)
  - WebSocket latência: se conexão cai, polling fallback a cada 10s (não perde atualizações)

- **Implementação sugerida (ordem)**:
  1. Melhorar `NotificationContext` para suportar limite de 3 toasts + fila
  2. Criar modelo `Notification` no Prisma
  3. Executar migration
  4. Criar repository e use cases
  5. Criar controllers GET/PATCH
  6. Criar `NotificationPanel` component
  7. Integrar `NotificationIcon` no header
  8. Criar hook `useNotifications` com polling
  9. Implementar WebSocket (opcional, com polling fallback)
  10. Implementar cron job de cleanup
  11. Integrar Observer pattern para emitir notificações (specs 0013, etc)
  12. Testes unitários e E2E

---

**Esta spec fornece sistema de feedback para 0013 (Webhooks), 0023 (Shopee Integration), e melhora UX geral de 0017 (Layout).**
