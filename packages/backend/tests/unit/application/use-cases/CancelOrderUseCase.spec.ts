import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CancelOrderUseCase } from '@/application/use-cases/CancelOrderUseCase';
import { Order } from '@/domain/entities/Order';

describe('CancelOrderUseCase', () => {
  let mockOrderRepository: any;
  let useCase: CancelOrderUseCase;

  const createMockOrder = (status: any = 'in_production') => Order.create({
    orderNumber: 'PED-001',
    customerId: 'customer-1',
    description: 'Design brochura',
    quantity: 100,
    status,
    salePrice: 100,
    productionCost: 50,
  });

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      cancel: vi.fn(),
      findStatusHistory: vi.fn(),
    };
    useCase = new CancelOrderUseCase(mockOrderRepository);
  });

  describe('Validação de existência', () => {
    it('deve bloquear cancelamento se pedido não existe', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent', 'Cliente cancelou')
      ).rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('Validação de motivo', () => {
    it('deve exigir motivo de cancelamento', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder());

      await expect(
        useCase.execute('order-1', '')
      ).rejects.toThrow('Motivo de cancelamento é obrigatório');
    });

    it('deve aceitar motivo válido', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.cancel.mockResolvedValue(Order.create({
        ...order.toJSON(),
        status: 'cancelled',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'Cliente cancelou');

      expect(result.status).toBe('cancelled');
      expect(result.cancellationReason).toBe('Cliente cancelou');
    });
  });

  describe('Bloqueio de cancelamento duplicado', () => {
    it('deve bloquear cancelamento se pedido já está cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('cancelled'));

      await expect(
        useCase.execute('order-1', 'Novo cancelamento')
      ).rejects.toThrow('Pedido já está cancelado');
    });
  });

  describe('Cancelamento de qualquer status', () => {
    it('deve permitir cancelamento de pedido em draft', async () => {
      const order = createMockOrder('draft');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.cancel.mockResolvedValue(Order.create({ ...order.toJSON(), status: 'cancelled' }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'Não é mais necessário');

      expect(result.status).toBe('cancelled');
    });

    it('deve permitir cancelamento de pedido em produção', async () => {
      const order = createMockOrder('in_production');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.cancel.mockResolvedValue(Order.create({ ...order.toJSON(), status: 'cancelled' }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'Parar produção');

      expect(result.status).toBe('cancelled');
    });

    it('deve permitir cancelamento de pedido concluído', async () => {
      const order = createMockOrder('completed');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.cancel.mockResolvedValue(Order.create({ ...order.toJSON(), status: 'cancelled' }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'Cliente solicitou devolução');

      expect(result.status).toBe('cancelled');
    });

    it('deve permitir cancelamento de pedido em shipping', async () => {
      const order = createMockOrder('shipping');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.cancel.mockResolvedValue(Order.create({ ...order.toJSON(), status: 'cancelled' }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'Interceptar shipment');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('Terminal state', () => {
    it('deve fazer cancelado um estado terminal (sem saída)', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('cancelled'));

      // Tentar cancelar novamente deve falhar
      await expect(
        useCase.execute('order-1', 'Cancelamento duplo')
      ).rejects.toThrow('Pedido já está cancelado');
    });
  });
});
