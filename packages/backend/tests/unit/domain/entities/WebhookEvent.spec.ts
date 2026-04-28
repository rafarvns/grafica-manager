import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookEvent, WebhookStatus, WebhookPlatform } from '@/domain/entities/WebhookEvent';

describe('WebhookEvent', () => {
  describe('Criação de evento webhook', () => {
    it('deve criar evento webhook com dados válidos', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: { order_id: 123456, buyer_id: 999 },
        rawPayload: '{"order_id":123456}',
      });

      expect(event.platform).toBe('shopee');
      expect(event.platformOrderId).toBe('123456');
      expect(event.payload).toEqual({ order_id: 123456, buyer_id: 999 });
      expect(event.status).toBe('pending');
      expect(event.retryCount).toBe(0);
      expect(event.createdAt).toBeInstanceOf(Date);
    });

    it('deve exigir platform válida', () => {
      expect(() => {
        WebhookEvent.create({
          platform: 'invalid_platform' as any,
          platformOrderId: '123456',
          payload: {},
          rawPayload: '{}',
        });
      }).toThrow('Platform inválida');
    });

    it('deve exigir platformOrderId não-vazio', () => {
      expect(() => {
        WebhookEvent.create({
          platform: 'shopee',
          platformOrderId: '',
          payload: {},
          rawPayload: '{}',
        });
      }).toThrow('platformOrderId é obrigatório');
    });

    it('deve armazenar rawPayload imutável', () => {
      const raw = '{"order_id":123456}';
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: { order_id: 123456 },
        rawPayload: raw,
      });

      expect(event.rawPayload).toBe(raw);
    });
  });

  describe('Status transitions', () => {
    it('deve permitir transição pending → processing', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsProcessing();

      expect(event.status).toBe('processing');
    });

    it('deve permitir transição processing → processed', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsProcessing();
      event.markAsProcessed();

      expect(event.status).toBe('processed');
    });

    it('deve permitir transição processing → error', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsProcessing();
      event.markAsError('API error');

      expect(event.status).toBe('error');
      expect(event.lastError).toBe('API error');
    });

    it('deve permitir transição pending → discarded', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsDiscarded('Invalid HMAC');

      expect(event.status).toBe('discarded');
      expect(event.discardReason).toBe('Invalid HMAC');
    });
  });

  describe('Retry logic', () => {
    it('deve incrementar retryCount ao falhar', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsProcessing();
      event.markAsError('Error 1');
      expect(event.retryCount).toBe(1);

      event.markAsProcessing();
      event.markAsError('Error 2');
      expect(event.retryCount).toBe(2);

      event.markAsProcessing();
      event.markAsError('Error 3');
      expect(event.retryCount).toBe(3);
    });

    it('deve permitir retry se retryCount < 3', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsProcessing();
      event.markAsError('Error 1');

      expect(event.canRetry()).toBe(true);
    });

    it('deve bloquear retry após 3 tentativas', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      for (let i = 0; i < 3; i++) {
        event.markAsProcessing();
        event.markAsError(`Error ${i + 1}`);
      }

      expect(event.canRetry()).toBe(false);
      expect(event.status).toBe('error');
    });

    it('deve calcular backoff delays: 30s, 5min, 30min', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      event.markAsProcessing();
      event.markAsError('Error 1');
      expect(event.getNextRetryDelay()).toBe(30000); // 30s

      event.markAsProcessing();
      event.markAsError('Error 2');
      expect(event.getNextRetryDelay()).toBe(300000); // 5min

      event.markAsProcessing();
      event.markAsError('Error 3');
      expect(event.getNextRetryDelay()).toBe(1800000); // 30min
    });
  });

  describe('Deduplication', () => {
    it('deve armazenar platformOrderId para deduplicação', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '987654321',
        payload: {},
        rawPayload: '{}',
      });

      expect(event.platformOrderId).toBe('987654321');
    });

    it('deve gerar deduplication key como "{platform}:{orderId}"', () => {
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123456',
        payload: {},
        rawPayload: '{}',
      });

      expect(event.getDeduplicationKey()).toBe('shopee:123456');
    });
  });

  describe('Imutabilidade de payload', () => {
    it('deve impedir modificação de payload após criação', () => {
      const original = { order_id: 123 };
      const event = WebhookEvent.create({
        platform: 'shopee',
        platformOrderId: '123',
        payload: original,
        rawPayload: '{}',
      });

      // Modificar o objeto original não afeta o evento
      original.order_id = 999;

      expect(event.payload.order_id).toBe(123);
    });
  });
});
