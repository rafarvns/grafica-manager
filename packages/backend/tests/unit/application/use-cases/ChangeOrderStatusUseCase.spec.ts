import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangeOrderStatusUseCase } from '@/application/use-cases/ChangeOrderStatusUseCase';

describe('ChangeOrderStatusUseCase', () => {
  let mockOrderRepository: any;
  let useCase: ChangeOrderStatusUseCase;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'PED-001',
    customerId: 'customer-1',
    description: 'Design',
    quantity: 100,
    status: 'draft',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
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
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'draft',
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'scheduled',
      });

      const result = await useCase.execute('order-1', 'scheduled');

      expect(result.status).toBe('scheduled');
    });

    it('deve permitir transição de draft direto para em produção (sem agendado)', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'draft',
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'in_production',
      });

      const result = await useCase.execute('order-1', 'in_production');

      expect(result.status).toBe('in_production');
    });

    it('deve permitir qualquer transição exceto de cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'in_production',
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'scheduled',
      });

      const result = await useCase.execute('order-1', 'scheduled');

      expect(result.status).toBe('scheduled');
    });
  });

  describe('Status cancelado é terminal', () => {
    it('deve bloquear mudança de status para cancelado (use case específico)', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'in_production',
      });

      // Cancelado deve ser feito via CancelOrderUseCase, não ChangeOrderStatusUseCase
      await expect(
        useCase.execute('order-1', 'cancelled')
      ).rejects.toThrow('Use CancelOrderUseCase para cancelar pedidos');
    });

    it('deve bloquear qualquer mudança se pedido já está cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
      });

      await expect(
        useCase.execute('order-1', 'scheduled')
      ).rejects.toThrow('Pedido cancelado não pode mudar de status');
    });
  });

  describe('Status shipping é read-only', () => {
    it('deve permitir transição para shipping', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'completed',
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'shipping',
      });

      const result = await useCase.execute('order-1', 'shipping');

      expect(result.status).toBe('shipping');
    });

    it('deve bloquear transição de shipping para outro status', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'shipping',
      });

      await expect(
        useCase.execute('order-1', 'completed')
      ).rejects.toThrow('Pedido em shipping não pode mudar de status');
    });
  });

  describe('Histórico de mudança de status', () => {
    it('deve registrar transição com timestamp', async () => {
      const now = new Date();
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'draft',
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'in_production',
      });

      await useCase.execute('order-1', 'in_production');

      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        'in_production',
        expect.objectContaining({
          fromStatus: 'draft',
          toStatus: 'in_production',
          timestamp: expect.any(Date),
        })
      );
    });

    it('deve permitir consultar histórico de transições', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        statusHistory: [
          {
            fromStatus: 'draft',
            toStatus: 'scheduled',
            timestamp: new Date('2026-04-25'),
          },
          {
            fromStatus: 'scheduled',
            toStatus: 'in_production',
            timestamp: new Date('2026-04-26'),
          },
        ],
      });

      const order = mockOrderRepository.findById('order-1');
      const history = await order;

      expect(history.statusHistory.length).toBe(2);
      expect(history.statusHistory[0].fromStatus).toBe('draft');
    });
  });

  describe('Validação de status', () => {
    it('deve validar que novo status é válido', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      await expect(
        useCase.execute('order-1', 'invalid_status' as any)
      ).rejects.toThrow('Status inválido');
    });

    it('deve bloquear transição para mesmo status', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'draft',
      });

      await expect(
        useCase.execute('order-1', 'draft')
      ).rejects.toThrow('Pedido já está em status draft');
    });
  });

  describe('Estados válidos', () => {
    it('deve aceitar todos os estados válidos', async () => {
      const validStatuses = ['draft', 'scheduled', 'in_production', 'completed', 'shipping'];

      for (const status of validStatuses) {
        mockOrderRepository.findById.mockResolvedValue({
          ...mockOrder,
          status: 'draft',
        });
        mockOrderRepository.updateStatus.mockResolvedValue({
          ...mockOrder,
          status,
        });

        const result = await useCase.execute('order-1', status as any);

        expect(result.status).toBe(status);
      }
    });
  });
});
