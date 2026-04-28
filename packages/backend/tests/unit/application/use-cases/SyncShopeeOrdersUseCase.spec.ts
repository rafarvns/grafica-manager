import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncShopeeOrdersUseCase } from '@/application/use-cases/SyncShopeeOrdersUseCase';

describe('SyncShopeeOrdersUseCase', () => {
  let mockShopeeApiAdapter: any;
  let mockOrderRepository: any;
  let mockJobQueue: any;
  let useCase: SyncShopeeOrdersUseCase;

  beforeEach(() => {
    mockShopeeApiAdapter = {
      getOrders: vi.fn(),
    };
    mockOrderRepository = {
      findByShopeeOrderId: vi.fn(),
    };
    mockJobQueue = {
      add: vi.fn(),
    };

    useCase = new SyncShopeeOrdersUseCase(
      mockShopeeApiAdapter,
      mockOrderRepository,
      mockJobQueue
    );
  });

  describe('Sincronização manual de pedidos', () => {
    it('deve buscar pedidos da API Shopee', async () => {
      mockShopeeApiAdapter.getOrders.mockResolvedValue([
        { order_id: 123, buyer_id: 1, order_sn: 'SN123', total_amount: 10000 },
      ]);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({});

      expect(mockShopeeApiAdapter.getOrders).toHaveBeenCalled();
      expect(result.totalOrders).toBe(1);
    });

    it('deve enfileirar processamento para cada pedido novo', async () => {
      const orders = [
        { order_id: 123, buyer_id: 1, order_sn: 'SN123' },
        { order_id: 124, buyer_id: 2, order_sn: 'SN124' },
      ];

      mockShopeeApiAdapter.getOrders.mockResolvedValue(orders);
      mockOrderRepository.findByShopeeOrderId
        .mockResolvedValueOnce(null) // primeiro não existe
        .mockResolvedValueOnce({ id: 'existing-2' }); // segundo já existe
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({});

      expect(result.totalOrders).toBe(2);
      expect(result.newOrders).toBe(1);
      expect(result.skippedDuplicates).toBe(1);
    });

    it('deve retornar contagem de pedidos sincronizados', async () => {
      const orders = [
        { order_id: 123, buyer_id: 1, order_sn: 'SN123' },
        { order_id: 124, buyer_id: 2, order_sn: 'SN124' },
        { order_id: 125, buyer_id: 3, order_sn: 'SN125' },
      ];

      mockShopeeApiAdapter.getOrders.mockResolvedValue(orders);
      mockOrderRepository.findByShopeeOrderId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-3' });
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      const result = await useCase.execute({});

      expect(result.totalOrders).toBe(3);
      expect(result.newOrders).toBe(2);
      expect(result.skippedDuplicates).toBe(1);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve capturar erro da API Shopee', async () => {
      mockShopeeApiAdapter.getOrders.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(useCase.execute({})).rejects.toThrow('API rate limit exceeded');
    });

    it('deve retornar contagem parcial se erro ocorrer durante processamento', async () => {
      const orders = [
        { order_id: 123, buyer_id: 1, order_sn: 'SN123' },
        { order_id: 124, buyer_id: 2, order_sn: 'SN124' },
      ];

      mockShopeeApiAdapter.getOrders.mockResolvedValue(orders);
      mockOrderRepository.findByShopeeOrderId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockJobQueue.add
        .mockResolvedValueOnce({ id: 'job-1' })
        .mockRejectedValueOnce(new Error('Queue Error'));

      const result = await useCase.execute({});

      expect(result.totalOrders).toBe(2);
      expect(result.newOrders).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Respeito ao rate limit', () => {
    it('deve buscar pedidos com limite de tempo especificado', async () => {
      mockShopeeApiAdapter.getOrders.mockResolvedValue([]);
      mockJobQueue.add.mockResolvedValue({ id: 'job-1' });

      await useCase.execute({ since: new Date('2026-04-20') });

      expect(mockShopeeApiAdapter.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          since: expect.any(Date),
        })
      );
    });

    it('deve retornar status de último sync', async () => {
      mockShopeeApiAdapter.getOrders.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.lastSyncAt).toBeInstanceOf(Date);
    });
  });

  describe('Idempotência', () => {
    it('deve pular pedidos já existentes no sistema', async () => {
      const orders = [
        { order_id: 123, buyer_id: 1, order_sn: 'SN123' },
        { order_id: 124, buyer_id: 2, order_sn: 'SN124' },
      ];

      mockShopeeApiAdapter.getOrders.mockResolvedValue(orders);
      mockOrderRepository.findByShopeeOrderId
        .mockResolvedValueOnce({ id: 'order-existing-1' })
        .mockResolvedValueOnce({ id: 'order-existing-2' });

      const result = await useCase.execute({});

      expect(result.newOrders).toBe(0);
      expect(result.skippedDuplicates).toBe(2);
      expect(mockJobQueue.add).not.toHaveBeenCalled();
    });
  });
});
