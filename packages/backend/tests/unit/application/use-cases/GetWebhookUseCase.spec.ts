import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetWebhookUseCase } from '@/application/use-cases/GetWebhookUseCase';

describe('GetWebhookUseCase', () => {
  let mockWebhookRepository: any;
  let useCase: GetWebhookUseCase;

  beforeEach(() => {
    mockWebhookRepository = {
      findById: vi.fn(),
    };

    useCase = new GetWebhookUseCase(mockWebhookRepository);
  });

  describe('Obtenção de webhook', () => {
    it('deve retornar webhook por ID', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        status: 'processed',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      const result = await useCase.execute({ webhookId: 'webhook-1' });

      expect(result.id).toBe('webhook-1');
      expect(result.platform).toBe('shopee');
      expect(result.platformOrderId).toBe('123');
    });

    it('deve lançar erro se webhook não encontrado', async () => {
      mockWebhookRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ webhookId: 'non-existent' })
      ).rejects.toThrow('Webhook not found');
    });

    it('deve retornar payload do webhook', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123, buyer_id: 456 },
        status: 'processed',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      const result = await useCase.execute({ webhookId: 'webhook-1' });

      expect(result.payload).toEqual({ order_id: 123, buyer_id: 456 });
    });

    it('deve retornar informações de erro se webhook falhou', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        retryCount: 2,
        lastError: 'API timeout',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      const result = await useCase.execute({ webhookId: 'webhook-1' });

      expect(result.status).toBe('error');
      expect(result.retryCount).toBe(2);
      expect(result.lastError).toBe('API timeout');
    });
  });
});
