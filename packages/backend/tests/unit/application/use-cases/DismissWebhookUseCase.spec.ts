import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DismissWebhookUseCase } from '@/application/use-cases/DismissWebhookUseCase';

describe('DismissWebhookUseCase', () => {
  let mockWebhookRepository: any;
  let useCase: DismissWebhookUseCase;

  beforeEach(() => {
    mockWebhookRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };

    useCase = new DismissWebhookUseCase(mockWebhookRepository);
  });

  describe('Descarte de webhook', () => {
    it('deve marcar webhook como discarded', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsDiscarded: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      const result = await useCase.execute({
        webhookId: 'webhook-1',
        reason: 'User decided to ignore this webhook',
      });

      expect(result.success).toBe(true);
    });

    it('deve registrar motivo do descarte', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsDiscarded: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      await useCase.execute({
        webhookId: 'webhook-1',
        reason: 'Duplicate webhook',
      });

      expect(webhook.markAsDiscarded).toHaveBeenCalledWith('Duplicate webhook');
    });

    it('deve salvar webhook atualizado', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsDiscarded: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      await useCase.execute({
        webhookId: 'webhook-1',
        reason: 'Invalid data',
      });

      expect(mockWebhookRepository.save).toHaveBeenCalledWith(webhook);
    });

    it('deve lançar erro se webhook não encontrado', async () => {
      mockWebhookRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          webhookId: 'non-existent',
          reason: 'Test',
        })
      ).rejects.toThrow('Webhook not found');
    });

    it('deve permitir descarte de webhooks em qualquer estado', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsDiscarded: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      const result = await useCase.execute({
        webhookId: 'webhook-1',
        reason: 'Manual dismiss',
      });

      expect(result.success).toBe(true);
    });

    it('deve retornar mensagem de sucesso', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsDiscarded: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      const result = await useCase.execute({
        webhookId: 'webhook-1',
        reason: 'Test',
      });

      expect(result.message).toBeDefined();
      expect(result.message).toContain('dismissed');
    });
  });
});
