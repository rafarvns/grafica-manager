import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryWebhookUseCase } from '@/application/use-cases/RetryWebhookUseCase';

describe('RetryWebhookUseCase', () => {
  let mockWebhookRepository: any;
  let mockJobQueue: any;
  let useCase: RetryWebhookUseCase;

  beforeEach(() => {
    mockWebhookRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };

    mockJobQueue = {
      add: vi.fn(),
    };

    useCase = new RetryWebhookUseCase(mockWebhookRepository, mockJobQueue);
  });

  describe('Reprocessamento manual de webhook', () => {
    it('deve enfileirar webhook para reprocessamento', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        status: 'error',
        retryCount: 2,
        markAsProcessing: vi.fn(),
        canRetry: () => true,
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({ webhookId: 'webhook-1' });

      expect(result.success).toBe(true);
    });

    it('deve marcar webhook como processing antes de enfileirar', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsProcessing: vi.fn(),
        canRetry: () => true,
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      await useCase.execute({ webhookId: 'webhook-1' });

      expect(webhook.markAsProcessing).toHaveBeenCalled();
    });

    it('deve salvar webhook atualizado', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        markAsProcessing: vi.fn(),
        canRetry: () => true,
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      await useCase.execute({ webhookId: 'webhook-1' });

      expect(mockWebhookRepository.save).toHaveBeenCalledWith(webhook);
    });

    it('deve lançar erro se webhook não encontrado', async () => {
      mockWebhookRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ webhookId: 'non-existent' })
      ).rejects.toThrow('Webhook not found');
    });

    it('deve lançar erro se webhook ainda pode reprocessar', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        retryCount: 3,
        canRetry: () => false,
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      await expect(
        useCase.execute({ webhookId: 'webhook-1' })
      ).rejects.toThrow('Max retries exceeded');
    });

    it('deve permitir reprocessamento se retry_count < 3', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        status: 'error',
        retryCount: 2,
        canRetry: () => true,
        markAsProcessing: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({ webhookId: 'webhook-1' });

      expect(result.success).toBe(true);
      expect(mockJobQueue.add).toHaveBeenCalled();
    });
  });
});
