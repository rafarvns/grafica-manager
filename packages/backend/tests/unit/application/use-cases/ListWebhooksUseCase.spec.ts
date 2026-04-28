import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListWebhooksUseCase } from '@/application/use-cases/ListWebhooksUseCase';

describe('ListWebhooksUseCase', () => {
  let mockWebhookRepository: any;
  let useCase: ListWebhooksUseCase;

  beforeEach(() => {
    mockWebhookRepository = {
      list: vi.fn(),
      count: vi.fn(),
    };

    useCase = new ListWebhooksUseCase(mockWebhookRepository);
  });

  describe('Listagem de webhooks', () => {
    it('deve listar todos os webhooks', async () => {
      const webhooks = [
        {
          id: 'webhook-1',
          platform: 'shopee',
          platformOrderId: '123',
          status: 'processed',
          retryCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWebhookRepository.list.mockResolvedValue(webhooks);
      mockWebhookRepository.count.mockResolvedValue(1);

      const result = await useCase.execute({});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('deve filtrar por plataforma', async () => {
      mockWebhookRepository.list.mockResolvedValue([]);
      mockWebhookRepository.count.mockResolvedValue(0);

      await useCase.execute({ platform: 'shopee' });

      expect(mockWebhookRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'shopee',
        })
      );
    });

    it('deve filtrar por status', async () => {
      mockWebhookRepository.list.mockResolvedValue([]);
      mockWebhookRepository.count.mockResolvedValue(0);

      await useCase.execute({ status: 'error' });

      expect(mockWebhookRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
        })
      );
    });

    it('deve respeitar limite e offset', async () => {
      mockWebhookRepository.list.mockResolvedValue([]);
      mockWebhookRepository.count.mockResolvedValue(0);

      await useCase.execute({ limit: 50, offset: 100 });

      expect(mockWebhookRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 100,
        })
      );
    });

    it('deve retornar metadados de paginação', async () => {
      mockWebhookRepository.list.mockResolvedValue([]);
      mockWebhookRepository.count.mockResolvedValue(150);

      const result = await useCase.execute({ limit: 50, offset: 0 });

      expect(result.total).toBe(150);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });
  });

  describe('Filtros combinados', () => {
    it('deve aceitar múltiplos filtros simultaneamente', async () => {
      mockWebhookRepository.list.mockResolvedValue([]);
      mockWebhookRepository.count.mockResolvedValue(0);

      await useCase.execute({
        platform: 'shopee',
        status: 'error',
        limit: 25,
        offset: 50,
      });

      expect(mockWebhookRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'shopee',
          status: 'error',
          limit: 25,
          offset: 50,
        })
      );
    });
  });

  describe('Comportamento padrão', () => {
    it('deve usar limite padrão se não especificado', async () => {
      mockWebhookRepository.list.mockResolvedValue([]);
      mockWebhookRepository.count.mockResolvedValue(0);

      await useCase.execute({});

      expect(mockWebhookRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });
  });
});
