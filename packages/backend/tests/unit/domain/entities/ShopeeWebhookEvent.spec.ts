import { describe, it, expect, beforeEach } from 'vitest';
import { ShopeeWebhookEvent, ShopeeWebhookEventType } from '@/domain/entities/ShopeeWebhookEvent';

describe('ShopeeWebhookEvent', () => {
  describe('Criação de evento webhook', () => {
    it('deve criar evento webhook com dados válidos', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: { buyer_id: 1, order_sn: 'SN123' },
      });

      expect(event.eventType).toBe('shop_order:new_order');
      expect(event.shopeeOrderId).toBe('123456789');
      expect(event.data).toEqual({ buyer_id: 1, order_sn: 'SN123' });
      expect(event.status).toBe('pending');
      expect(event.retryCount).toBe(0);
    });

    it('deve validar tipo de evento', () => {
      expect(() => {
        ShopeeWebhookEvent.create({
          eventType: 'invalid_event_type',
          shopeeOrderId: '123456789',
          data: {},
        });
      }).toThrow();
    });

    it('deve exigir shopeeOrderId para eventos de pedido', () => {
      expect(() => {
        ShopeeWebhookEvent.create({
          eventType: 'shop_order:new_order',
          shopeeOrderId: '',
          data: {},
        });
      }).toThrow();
    });

    it('deve ter timestamp de criação', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      expect(event.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Transições de status', () => {
    it('deve permitir transição de pending para processing', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      event.markAsProcessing();

      expect(event.status).toBe('processing');
    });

    it('deve permitir transição de processing para completed', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      event.markAsProcessing();
      event.markAsCompleted();

      expect(event.status).toBe('completed');
    });

    it('deve permitir transição de processing para failed', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      event.markAsProcessing();
      event.markAsFailed('API error');

      expect(event.status).toBe('failed');
      expect(event.errorMessage).toBe('API error');
    });

    it('deve incrementar retryCount ao falhar', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      event.markAsProcessing();
      event.markAsFailed('Error 1');
      event.markAsProcessing();
      event.markAsFailed('Error 2');

      expect(event.retryCount).toBe(2);
    });

    it('deve bloquear reprocessamento após max retries', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      for (let i = 0; i < 3; i++) {
        event.markAsProcessing();
        event.markAsFailed(`Error ${i + 1}`);
      }

      expect(event.status).toBe('failed');
      expect(event.canRetry()).toBe(false);
    });

    it('deve permitir reprocessamento se retryCount < 3', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456789',
        data: {},
      });

      event.markAsProcessing();
      event.markAsFailed('Error');

      expect(event.canRetry()).toBe(true);
    });
  });

  describe('Tipos de evento válidos', () => {
    it('deve aceitar "shop_order:new_order"', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123',
        data: {},
      });

      expect(event.eventType).toBe('shop_order:new_order');
    });

    it('deve aceitar "shop_order:cancelled"', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:cancelled',
        shopeeOrderId: '123',
        data: {},
      });

      expect(event.eventType).toBe('shop_order:cancelled');
    });

    it('deve rejeitar tipos de evento inválidos', () => {
      expect(() => {
        ShopeeWebhookEvent.create({
          eventType: 'invalid_event',
          shopeeOrderId: '123',
          data: {},
        });
      }).toThrow();
    });
  });

  describe('Deduplicação por shopeeOrderId', () => {
    it('deve armazenar shopeeOrderId para deduplicação', () => {
      const event = ShopeeWebhookEvent.create({
        eventType: 'shop_order:new_order',
        shopeeOrderId: '987654321',
        data: {},
      });

      expect(event.shopeeOrderId).toBe('987654321');
    });
  });
});
