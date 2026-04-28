import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessShopeeWebhookUseCase } from '@/application/use-cases/ProcessShopeeWebhookUseCase';

describe('ProcessShopeeWebhookUseCase', () => {
  let mockHmacValidator: any;
  let mockWebhookRepository: any;
  let mockOrderRepository: any;
  let mockCustomerRepository: any;
  let mockCreateOrderUseCase: any;
  let mockCancelOrderUseCase: any;
  let mockJobQueue: any;
  let useCase: ProcessShopeeWebhookUseCase;

  beforeEach(() => {
    mockHmacValidator = {
      validate: vi.fn(),
    };
    mockWebhookRepository = {
      save: vi.fn(),
      findByShopeeOrderId: vi.fn(),
    };
    mockOrderRepository = {
      findByShopeeOrderId: vi.fn(),
    };
    mockCustomerRepository = {
      findByEmail: vi.fn(),
    };
    mockCreateOrderUseCase = {
      execute: vi.fn(),
    };
    mockCancelOrderUseCase = {
      execute: vi.fn(),
    };
    mockJobQueue = {
      add: vi.fn(),
    };

    useCase = new ProcessShopeeWebhookUseCase(
      mockHmacValidator,
      mockWebhookRepository,
      mockOrderRepository,
      mockCustomerRepository,
      mockCreateOrderUseCase,
      mockCancelOrderUseCase,
      mockJobQueue
    );
  });

  describe('Validação de webhook', () => {
    it('deve rejeitar webhook com HMAC inválido', async () => {
      mockHmacValidator.validate.mockReturnValue(false);

      await expect(
        useCase.execute({
          eventType: 'shop_order:new_order',
          data: { order_id: 123 },
          signature: 'invalid',
          rawPayload: '{"eventType":"shop_order:new_order"}',
        })
      ).rejects.toThrow('HMAC validation failed');
    });

    it('deve aceitar webhook com HMAC válido', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      const rawPayload = JSON.stringify({
        event: 'shop_order:new_order',
        data: { order_id: 123, buyer_id: 456 },
      });

      const result = await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123, buyer_id: 456 },
        signature: 'valid-signature',
        rawPayload,
      });

      expect(result.status).toBe('accepted');
    });
  });

  describe('Deduplicação de webhooks', () => {
    it('deve detectar webhook duplicado pela shopeeOrderId', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue({
        getStatus: () => 'completed',
        getId: () => 'existing-event-1',
      });

      const result = await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123 },
        signature: 'valid',
        rawPayload: '{"event":"shop_order:new_order"}',
      });

      expect(result.status).toBe('duplicate');
      expect(result.message).toContain('Webhook duplicado');
    });

    it('deve permitir reprocessamento de webhook falhado', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(null);

      const rawPayload = JSON.stringify({
        event: 'shop_order:new_order',
        data: { order_id: 123, buyer_id: 456 },
      });

      const result = await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123, buyer_id: 456 },
        signature: 'valid',
        rawPayload,
      });

      expect(result.status).toBe('accepted');
    });
  });

  describe('Processamento assíncrono', () => {
    it('deve enfileirar processamento de novo pedido', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123, buyer_id: 456 },
        signature: 'valid',
        rawPayload: '{"event":"shop_order:new_order"}',
      });

      expect(result.status).toBe('accepted');
      expect(mockJobQueue.add).toHaveBeenCalled();
    });

    it('deve retornar 202 imediatamente (sem aguardar processamento)', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123 },
        signature: 'valid',
        rawPayload: '{}',
      });

      expect(result.status).toBe('accepted');
      expect(result.httpStatus).toBe(202);
    });
  });

  describe('Tipos de evento', () => {
    it('deve aceitar evento "shop_order:new_order"', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123 },
        signature: 'valid',
        rawPayload: '{}',
      });

      expect(result.status).toBe('accepted');
    });

    it('deve aceitar evento "shop_order:cancelled"', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({
        eventType: 'shop_order:cancelled',
        data: { order_id: 456 },
        signature: 'valid',
        rawPayload: '{}',
      });

      expect(result.status).toBe('accepted');
    });

    it('deve rejeitar tipo de evento inválido', async () => {
      mockHmacValidator.validate.mockReturnValue(true);

      await expect(
        useCase.execute({
          eventType: 'invalid_event_type',
          data: {},
          signature: 'valid',
          rawPayload: '{}',
        })
      ).rejects.toThrow();
    });
  });

  describe('Salvamento de evento', () => {
    it('deve salvar evento webhook no repositório', async () => {
      mockHmacValidator.validate.mockReturnValue(true);
      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      await useCase.execute({
        eventType: 'shop_order:new_order',
        data: { order_id: 123, buyer_id: 456 },
        signature: 'valid',
        rawPayload: '{"event":"shop_order:new_order"}',
      });

      expect(mockWebhookRepository.save).toHaveBeenCalled();
    });
  });

  describe('Logging de segurança', () => {
    it('deve registrar tentativa de webhook com HMAC inválido', async () => {
      mockHmacValidator.validate.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'warn');

      await expect(
        useCase.execute({
          eventType: 'shop_order:new_order',
          data: {},
          signature: 'invalid',
          rawPayload: '{}',
        })
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
