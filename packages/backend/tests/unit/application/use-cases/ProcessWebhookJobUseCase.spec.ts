import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessWebhookJobUseCase } from '@/application/use-cases/ProcessWebhookJobUseCase';

describe('ProcessWebhookJobUseCase', () => {
  let mockWebhookRepository: any;
  let mockPlatformHandlers: any;
  let useCase: ProcessWebhookJobUseCase;

  beforeEach(() => {
    mockWebhookRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };

    mockPlatformHandlers = {
      shopee: vi.fn(),
    };

    useCase = new ProcessWebhookJobUseCase(
      mockWebhookRepository,
      mockPlatformHandlers
    );
  });

  describe('Processamento de job de webhook', () => {
    it('deve carregar webhook do repositório', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsProcessed: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockResolvedValue(undefined);

      await useCase.execute({
        webhookId: 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        data: { order_id: 123 },
      });

      expect(mockWebhookRepository.findById).toHaveBeenCalledWith('webhook-1');
    });

    it('deve marcar webhook como processando', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsProcessed: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockResolvedValue(undefined);

      await useCase.execute({
        webhookId: 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        data: { order_id: 123 },
      });

      expect(webhook.markAsProcessing).toHaveBeenCalled();
    });

    it('deve chamar handler específico da plataforma', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsProcessed: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockResolvedValue(undefined);

      await useCase.execute({
        webhookId: 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        data: { order_id: 123 },
      });

      expect(mockPlatformHandlers.shopee).toHaveBeenCalledWith({
        webhookId: 'webhook-1',
        platformOrderId: '123',
        data: { order_id: 123 },
      });
    });

    it('deve marcar webhook como processado após sucesso', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsProcessed: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockResolvedValue(undefined);

      await useCase.execute({
        webhookId: 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        data: { order_id: 123 },
      });

      expect(webhook.markAsProcessed).toHaveBeenCalled();
    });

    it('deve salvar webhook atualizado no repositório', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsProcessed: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockResolvedValue(undefined);

      await useCase.execute({
        webhookId: 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        data: { order_id: 123 },
      });

      expect(mockWebhookRepository.save).toHaveBeenCalledWith(webhook);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve marcar webhook como erro se handler falhar', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsError: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(
        useCase.execute({
          webhookId: 'webhook-1',
          platform: 'shopee',
          platformOrderId: '123',
          data: { order_id: 123 },
        })
      ).rejects.toThrow('Processing failed');

      expect(webhook.markAsError).toHaveBeenCalledWith('Processing failed');
    });

    it('deve salvar webhook em erro após falha', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsError: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(
        useCase.execute({
          webhookId: 'webhook-1',
          platform: 'shopee',
          platformOrderId: '123',
          data: { order_id: 123 },
        })
      ).rejects.toThrow('Processing failed');

      expect(mockWebhookRepository.save).toHaveBeenCalledWith(webhook);
    });

    it('deve relançar erro para fila reprocessar', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsError: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      const error = new Error('API error');
      mockPlatformHandlers.shopee.mockRejectedValue(error);

      await expect(
        useCase.execute({
          webhookId: 'webhook-1',
          platform: 'shopee',
          platformOrderId: '123',
          data: { order_id: 123 },
        })
      ).rejects.toThrow('API error');
    });
  });

  describe('Suporte a múltiplas plataformas', () => {
    it('deve processar webhook Shopee', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        payload: { order_id: 123 },
        markAsProcessing: vi.fn(),
        markAsProcessed: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);
      mockPlatformHandlers.shopee.mockResolvedValue(undefined);

      await useCase.execute({
        webhookId: 'webhook-1',
        platform: 'shopee',
        platformOrderId: '123',
        data: { order_id: 123 },
      });

      expect(mockPlatformHandlers.shopee).toHaveBeenCalled();
    });

    it('deve lançar erro para plataforma desconhecida', async () => {
      const webhook = {
        getId: () => 'webhook-1',
        platform: 'unknown',
        platformOrderId: '123',
        payload: {},
        markAsProcessing: vi.fn(),
      };

      mockWebhookRepository.findById.mockResolvedValue(webhook);

      await expect(
        useCase.execute({
          webhookId: 'webhook-1',
          platform: 'unknown',
          platformOrderId: '123',
          data: {},
        })
      ).rejects.toThrow('Handler not found for platform: unknown');
    });
  });
});
