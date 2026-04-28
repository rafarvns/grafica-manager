import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HandleShopeeOrderUseCase } from '@/application/use-cases/HandleShopeeOrderUseCase';

describe('HandleShopeeOrderUseCase', () => {
  let mockWebhookRepository: any;
  let mockOrderRepository: any;
  let mockCustomerRepository: any;
  let mockCreateOrderUseCase: any;
  let mockCancelOrderUseCase: any;
  let useCase: HandleShopeeOrderUseCase;

  beforeEach(() => {
    mockWebhookRepository = {
      findByShopeeOrderId: vi.fn(),
      save: vi.fn(),
    };
    mockOrderRepository = {
      findByShopeeOrderId: vi.fn(),
    };
    mockCustomerRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    };
    mockCreateOrderUseCase = {
      execute: vi.fn(),
    };
    mockCancelOrderUseCase = {
      execute: vi.fn(),
    };

    useCase = new HandleShopeeOrderUseCase(
      mockWebhookRepository,
      mockOrderRepository,
      mockCustomerRepository,
      mockCreateOrderUseCase,
      mockCancelOrderUseCase
    );
  });

  describe('Novo pedido Shopee', () => {
    it('deve criar pedido interno quando novo pedido chega', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:new_order',
        getShopeeOrderId: () => '123456',
        getData: () => ({
          order_id: 123456,
          buyer_id: 999,
          order_sn: 'SN123456',
          total_amount: 10000,
          buyer_email: 'buyer@example.com',
          buyer_name: 'João Comprador',
        }),
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockCustomerRepository.findByEmail.mockResolvedValue({
        id: 'customer-1',
        name: 'João Comprador',
      });
      mockCreateOrderUseCase.execute.mockResolvedValue({
        id: 'order-1',
        shopeeOrderId: '123456',
      });

      await useCase.execute({
        eventId: 'event-1',
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456',
        data: {
          order_id: 123456,
          buyer_id: 999,
          order_sn: 'SN123456',
          total_amount: 10000,
          buyer_email: 'buyer@example.com',
          buyer_name: 'João Comprador',
        },
      });

      expect(mockCreateOrderUseCase.execute).toHaveBeenCalled();
      expect(event.markAsCompleted).toHaveBeenCalled();
    });

    it('deve criar cliente se comprador não existir', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:new_order',
        getShopeeOrderId: () => '123456',
        getData: () => ({
          order_id: 123456,
          buyer_id: 999,
          buyer_email: 'newbuyer@example.com',
          buyer_name: 'Novo Comprador',
          total_amount: 10000,
        }),
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerRepository.save.mockResolvedValue({ id: 'customer-new' });
      mockCreateOrderUseCase.execute.mockResolvedValue({ id: 'order-1' });

      await useCase.execute({
        eventId: 'event-1',
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456',
        data: {
          order_id: 123456,
          buyer_id: 999,
          buyer_email: 'newbuyer@example.com',
          buyer_name: 'Novo Comprador',
          total_amount: 10000,
        },
      });

      expect(mockCustomerRepository.save).toHaveBeenCalled();
      expect(mockCreateOrderUseCase.execute).toHaveBeenCalled();
    });

    it('deve criar pedido com status "agendado"', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:new_order',
        getShopeeOrderId: () => '123456',
        getData: () => ({
          order_id: 123456,
          buyer_id: 999,
          buyer_email: 'buyer@example.com',
          buyer_name: 'Comprador',
          total_amount: 10000,
        }),
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockCustomerRepository.findByEmail.mockResolvedValue({ id: 'customer-1' });
      mockCreateOrderUseCase.execute.mockResolvedValue({ id: 'order-1' });

      await useCase.execute({
        eventId: 'event-1',
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456',
        data: {
          order_id: 123456,
          buyer_id: 999,
          buyer_email: 'buyer@example.com',
          buyer_name: 'Comprador',
          total_amount: 10000,
        },
      });

      const callArgs = mockCreateOrderUseCase.execute.mock.calls[0][0];
      expect(callArgs.status).toBe('scheduled');
      expect(callArgs.shopeeOrderId).toBe('123456');
    });
  });

  describe('Cancelamento de pedido Shopee', () => {
    it('deve cancelar pedido interno quando webhook de cancelamento chega', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:cancelled',
        getShopeeOrderId: () => '123456',
        getData: () => ({ order_id: 123456 }),
      };

      const internalOrder = {
        id: 'order-1',
        shopeeOrderId: '123456',
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(internalOrder);
      mockCancelOrderUseCase.execute.mockResolvedValue({ id: 'order-1' });

      await useCase.execute({
        eventId: 'event-1',
        eventType: 'shop_order:cancelled',
        shopeeOrderId: '123456',
        data: { order_id: 123456 },
      });

      expect(mockCancelOrderUseCase.execute).toHaveBeenCalledWith(
        'order-1',
        'Cancelado via Shopee'
      );
      expect(event.markAsCompleted).toHaveBeenCalled();
    });

    it('deve ignorar cancelamento se pedido não existe', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:cancelled',
        getShopeeOrderId: () => '999999',
        getData: () => ({ order_id: 999999 }),
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(null);

      await useCase.execute({
        eventId: 'event-1',
        eventType: 'shop_order:cancelled',
        shopeeOrderId: '999999',
        data: { order_id: 999999 },
      });

      expect(mockCancelOrderUseCase.execute).not.toHaveBeenCalled();
      expect(event.markAsCompleted).toHaveBeenCalled();
    });
  });

  describe('Tratamento de erros', () => {
    it('deve marcar evento como falha se erro ocorrer', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:new_order',
        getShopeeOrderId: () => '123456',
        getData: () => ({}),
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue(null);
      mockCustomerRepository.findByEmail.mockRejectedValue(new Error('DB Error'));

      await expect(
        useCase.execute({
          eventId: 'event-1',
          eventType: 'shop_order:new_order',
          shopeeOrderId: '123456',
          data: { order_id: 123456, buyer_email: 'buyer@example.com' },
        })
      ).rejects.toThrow('DB Error');

      expect(event.markAsFailed).toHaveBeenCalled();
      expect(mockWebhookRepository.save).toHaveBeenCalled();
    });
  });

  describe('Idempotência', () => {
    it('deve ignorar se pedido interno já existe para mesmo shopeeOrderId', async () => {
      const event = {
        getId: () => 'event-1',
        getStatus: () => 'pending',
        markAsProcessing: vi.fn(),
        markAsCompleted: vi.fn(),
        markAsFailed: vi.fn(),
        getEventType: () => 'shop_order:new_order',
        getShopeeOrderId: () => '123456',
        getData: () => ({
          order_id: 123456,
          buyer_email: 'buyer@example.com',
        }),
      };

      mockWebhookRepository.findByShopeeOrderId.mockResolvedValue(event);
      mockOrderRepository.findByShopeeOrderId.mockResolvedValue({
        id: 'order-existing',
        shopeeOrderId: '123456',
      });

      await useCase.execute({
        eventId: 'event-1',
        eventType: 'shop_order:new_order',
        shopeeOrderId: '123456',
        data: { order_id: 123456, buyer_email: 'buyer@example.com' },
      });

      expect(mockCreateOrderUseCase.execute).not.toHaveBeenCalled();
      expect(event.markAsCompleted).toHaveBeenCalled();
    });
  });
});
