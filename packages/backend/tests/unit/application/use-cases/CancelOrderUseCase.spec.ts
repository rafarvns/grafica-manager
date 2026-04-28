import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CancelOrderUseCase } from '@/application/use-cases/CancelOrderUseCase';

describe('CancelOrderUseCase', () => {
  let mockOrderRepository: any;
  let useCase: CancelOrderUseCase;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'PED-001',
    customerId: 'customer-1',
    status: 'in_production',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
      cancel: vi.fn(),
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
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      await expect(
        useCase.execute('order-1', '')
      ).rejects.toThrow('Motivo de cancelamento é obrigatório');
    });

    it('deve aceitar motivo válido', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.cancel.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Cliente cancelou',
      });

      const result = await useCase.execute('order-1', 'Cliente cancelou');

      expect(result.status).toBe('cancelled');
      expect(result.cancellationReason).toBe('Cliente cancelou');
    });
  });

  describe('Bloqueio de cancelamento duplicado', () => {
    it('deve bloquear cancelamento se pedido já está cancelado', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Já foi cancelado',
      });

      await expect(
        useCase.execute('order-1', 'Novo cancelamento')
      ).rejects.toThrow('Pedido já está cancelado');
    });
  });

  describe('Cancelamento de qualquer status', () => {
    it('deve permitir cancelamento de pedido em draft', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'draft',
      });
      mockOrderRepository.cancel.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Não é mais necessário',
      });

      const result = await useCase.execute('order-1', 'Não é mais necessário');

      expect(result.status).toBe('cancelled');
    });

    it('deve permitir cancelamento de pedido em produção', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'in_production',
      });
      mockOrderRepository.cancel.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Parar produção',
      });

      const result = await useCase.execute('order-1', 'Parar produção');

      expect(result.status).toBe('cancelled');
    });

    it('deve permitir cancelamento de pedido concluído', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'completed',
      });
      mockOrderRepository.cancel.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Cliente solicitou devolução',
      });

      const result = await useCase.execute('order-1', 'Cliente solicitou devolução');

      expect(result.status).toBe('cancelled');
    });

    it('deve permitir cancelamento de pedido em shipping', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'shipping',
      });
      mockOrderRepository.cancel.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Interceptar shipment',
      });

      const result = await useCase.execute('order-1', 'Interceptar shipment');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('Histórico de cancelamento', () => {
    it('deve registrar cancelamento no histórico com timestamp', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.cancel.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Cancelado pelo cliente',
        cancellationTime: new Date(),
      });

      await useCase.execute('order-1', 'Cancelado pelo cliente');

      expect(mockOrderRepository.cancel).toHaveBeenCalledWith(
        'order-1',
        'Cancelado pelo cliente',
        expect.any(Date)
      );
    });
  });

  describe('Terminal state', () => {
    it('deve fazer cancelado um estado terminal (sem saída)', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'cancelled',
        cancellationReason: 'Cancelado',
      });

      // Tentar cancelar novamente deve falhar
      await expect(
        useCase.execute('order-1', 'Cancelamento duplo')
      ).rejects.toThrow('Pedido já está cancelado');
    });
  });
});
