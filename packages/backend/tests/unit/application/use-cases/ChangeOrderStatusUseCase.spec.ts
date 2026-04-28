import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangeOrderStatusUseCase } from '@/application/use-cases/ChangeOrderStatusUseCase';
import { Order } from '@/domain/entities/Order';

describe('ChangeOrderStatusUseCase', () => {
  let mockOrderRepository: any;
  let useCase: ChangeOrderStatusUseCase;

  const createMockOrder = (status: any = 'draft') => Order.create({
    orderNumber: 'PED-001',
    customerId: 'customer-1',
    description: 'Design',
    quantity: 100,
    status,
    salePrice: 100,
    productionCost: 50,
  });

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
      findStatusHistory: vi.fn(),
    };
    useCase = new ChangeOrderStatusUseCase(mockOrderRepository);
  });

  describe('Validação de existência', () => {
    it('deve bloquear mudança se pedido não existe', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent', 'in_production')
      ).rejects.toThrow('Pedido não encontrado');
    });
  });

  describe('Transições de status', () => {
    it('deve permitir transição de draft para agendado', async () => {
      const order = createMockOrder('draft');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.updateStatus.mockResolvedValue(Order.create({
        ...order.toJSON(),
        status: 'scheduled',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'scheduled');

      expect(result.status).toBe('scheduled');
    });

    it('deve permitir transição de draft direto para em produção (sem agendado)', async () => {
      const order = createMockOrder('draft');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.updateStatus.mockResolvedValue(Order.create({
        ...order.toJSON(),
        status: 'in_production',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'in_production');

      expect(result.status).toBe('in_production');
    });
  });

  describe('Status cancelado é terminal', () => {
    it('deve bloquear mudança de status para cancelado (use case específico)', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('in_production'));

      // Cancelado deve ser feito via CancelOrderUseCase, não ChangeOrderStatusUseCase
      await expect(
        useCase.execute('order-1', 'cancelled')
      ).rejects.toThrow('Use CancelOrderUseCase para cancelar pedidos');
    });

    it('deve bloquear qualquer mudança se pedido já está cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('cancelled'));

      await expect(
        useCase.execute('order-1', 'scheduled')
      ).rejects.toThrow('Pedido cancelado não pode mudar de status');
    });
  });

  describe('Status shipping é read-only', () => {
    it('deve permitir transição para shipping', async () => {
      const order = createMockOrder('completed');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.updateStatus.mockResolvedValue(Order.create({
        ...order.toJSON(),
        status: 'shipping',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      const result = await useCase.execute(order.id, 'shipping');

      expect(result.status).toBe('shipping');
    });

    it('deve bloquear transição de shipping para outro status', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('shipping'));

      await expect(
        useCase.execute('order-1', 'completed')
      ).rejects.toThrow('Pedido em shipping não pode mudar de status');
    });
  });

  describe('Histórico de mudança de status', () => {
    it('deve registrar transição com timestamp', async () => {
      const order = createMockOrder('draft');
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.updateStatus.mockResolvedValue(Order.create({
        ...order.toJSON(),
        status: 'in_production',
      }));
      mockOrderRepository.findStatusHistory.mockResolvedValue([]);

      await useCase.execute(order.id, 'in_production');

      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        order.id,
        'in_production',
        expect.objectContaining({
          fromStatus: 'draft',
          toStatus: 'in_production',
        })
      );
    });
  });

  describe('Validação de status', () => {
    it('deve validar que novo status é válido', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder());

      await expect(
        useCase.execute('order-1', 'invalid_status' as any)
      ).rejects.toThrow('Status inválido');
    });

    it('deve bloquear transição para mesmo status', async () => {
      mockOrderRepository.findById.mockResolvedValue(createMockOrder('draft'));

      await expect(
        useCase.execute('order-1', 'draft')
      ).rejects.toThrow('Pedido já está em status draft');
    });
  });
});
