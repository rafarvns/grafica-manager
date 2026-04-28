# ADR 0002: Job Queue — Bull + Redis

**Status:** Accepted  
**Date:** 2026-04-27  
**Author:** rafarvns  
**Context Specs:** 0012 (Shopee Integration), 0013 (Automatic Webhook Reception), 0016 (Detailed Reports)

---

## Contexto

Os specs 0012, 0013 e 0016 requerem processamento assíncrono de:
- Webhooks de pedidos (enfileirados, processados em background com retry automático)
- Sincronização com Shopee API (falhas replicadas 3x com backoff)
- Geração de relatórios grandes (não bloqueia UI)

**Requisitos:**
- Enfileiramento: webhook responde 202 imediatamente, processamento acontece depois
- Retry automático: 3 tentativas com backoff exponencial (30s → 5min → 30min)
- Persistência: fila não desaparece se aplicação fechar
- Monitoramento: painel visual de jobs falhos e pendentes
- Idempotência: mesmo job 2x = resultado 1x

**Três opções consideradas:**

### Opção A: Bull + Redis

```
✓ Enfileiramento robusto com persistência em Redis
✓ Retry built-in com backoff exponencial (0-retries, -backoff flags)
✓ Web UI para monitoramento (bull-board)
✓ Timing e delay nativos (agendamento)
✓ Escala horizontal se necessário
✗ Redis como dependência adicional de infraestrutura
```

### Opção B: RabbitMQ

```
✓ Altamente robusto e escalável
✓ Suporta múltiplos padrões (pub/sub, RPC)
✓ Gerenciamento avançado de filas
✗ Complexidade de setup e operação muito maior
✗ Overkill para MVP de desktop
```

### Opção C: Async/Await nativo + setTimeout

```
✓ Zero dependências externas
✓ Rápido para desenvolver
✗ Fila vive apenas em memória (perde ao reiniciar)
✗ Retry manual = código complexo
✗ Sem persistência = perda de eventos
✗ Sem monitoramento built-in
```

---

## Decisão

**Bull + Redis**

### Justificativa

1. **MVP rodando em desktop** — Redis é light (container Docker, ~30MB). RabbitMQ seria overkill.
2. **Retry e persistência críticas** — webhooks Shopee precisam de garantia de entrega. Async nativo não tem.
3. **Monitoramento** — bull-board permite visualizar fila, jobs falhos e retries. Essencial para troubleshooting.
4. **Timing** — backoff exponencial nativo em Bull (sem código custom).
5. **Flexibilidade futura** — se escalar, trocá-lo por RabbitMQ é direto (interface consistente).

---

## Consequências

### Positivas

- ✓ Webhooks enfileirados e processados de forma confiável
- ✓ Retry automático com backoff — sem perder eventos em caso de falha transitória
- ✓ bull-board para visualizar estado da fila em tempo real
- ✓ Código de job fica simples (Bull cuida de scheduling/retry)

### Negativas

- ✗ Redis como dependência de infraestrutura adicional
  - Usuário precisa ter Redis rodando (Docker Compose incluído)
  - Se Redis cair, fila fica unavailable (single point of failure)
- ✗ Setup inicial um pouco mais complexo (vs async nativo)
- ✗ Consumo de memória/CPU da máquina (Redis + MySQL + Electron)

### Mitigação

- Documentar Docker Compose com Redis + MySQL
- Alertas no painel se Redis desconectar
- Fallback possível para async nativo se Redis não estiver disponível (degraded mode) — implementar em ADR futura se necessário

---

## Especificação Técnica

### Instalação

```bash
npm install bull redis
npm install --save-dev @types/bull
```

### Configuração

```typescript
// packages/backend/src/infrastructure/config/bull.ts
import Bull from 'bull';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const webhookQueue = new Bull('webhooks', REDIS_URL);
export const reportQueue = new Bull('reports', REDIS_URL);
export const syncQueue = new Bull('shopee-sync', REDIS_URL);

// Retry policy para webhooks (spec 0013)
webhookQueue.process(async (job) => {
  // ... processar webhook
});

webhookQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});
```

### docker-compose.yml (adicionar ao projeto)

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

### Environment Variables

```env
# .env
REDIS_URL=redis://localhost:6379
```

---

## Referências

- [Bull Documentation](https://docs.bullmq.io/)
- [bull-board](https://github.com/felixmosh/bull-board) — Web UI para monitorar filas
- [Spec 0013: Automatic Webhook Reception](../specs/0013-automatic-order-webhook-reception.md)
- [Spec 0012: Shopee Integration](../specs/0012-shopee-integration.md)

---

## Status de Aprovação

- [x] Alinhado com specs 0012/0013/0016
- [x] Avaliadas alternativas
- [x] Mitigações documentadas
- [ ] Implementação iniciada (próximo passo)
