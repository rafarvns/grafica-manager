import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidateOrderDeletionUseCase } from '@/application/use-cases/ValidateOrderDeletionUseCase';

describe('ValidateOrderDeletionUseCase', () => {
  let mockOrderRepository: any;
  let mockPrintJobRepository: any;
  let useCase: ValidateOrderDeletionUseCase;

  beforeEach(() => {
    mockOrderRepository = {
      findById: vi.fn(),
    };
    mockPrintJobRepository = {
      countInProgressByOrderId: vi.fn(),
    };
    useCase = new ValidateOrderDeletionUseCase(
      mockOrderRepository,
      mockPrintJobRepository
    );
  });

  describe('Validação de existência', () => {
    it('deve bloquear deleção se pedido não existe', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Pedido não encontrado'
      );
    });
  });

  describe('Bloqueio de deleção com impressões em andamento', () => {
    it('deve bloquear se pedido tem impressões em andamento', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(2);

      await expect(useCase.execute('order-1')).rejects.toThrow(
        'Pedido possui 2 impressões em andamento'
      );
    });

    it('deve permitir deleção se não há impressões em andamento', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(0);

      const result = await useCase.execute('order-1');

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('deve permitir deleção se apenas impressões concluídas/com erro', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(0);

      const result = await useCase.execute('order-1');

      expect(result.canDelete).toBe(true);
    });

    it('deve fornecer motivo do bloqueio com contagem', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(3);

      await expect(useCase.execute('order-1')).rejects.toThrow(
        'Pedido possui 3 impressões em andamento'
      );
    });
  });

  describe('Resposta de validação', () => {
    it('deve retornar canDelete=true e reason=null se liberado', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(0);

      const result = await useCase.execute('order-1');

      expect(result).toEqual({
        canDelete: true,
        reason: null,
        inProgressPrintJobCount: 0,
      });
    });

    it('deve incluir contagem de impressões em andamento', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(0);

      const result = await useCase.execute('order-1');

      expect(result.inProgressPrintJobCount).toBe(0);
    });
  });

  describe('Definição de "em andamento"', () => {
    it('deve considerar em andamento impressões com status sucesso ou erro ainda sendo processadas', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
      });

      // Repository deve contar apenas impressões em processo
      // Não contar: concluídas, com erro registrado
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(0);

      const result = await useCase.execute('order-1');

      expect(result.canDelete).toBe(true);
    });
  });

  describe('Casos de uso', () => {
    it('deve permitir deletar pedido sem impressões', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        status: 'draft',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(0);

      const result = await useCase.execute('order-1');

      expect(result.canDelete).toBe(true);
    });

    it('deve bloquear deletar pedido em produção com impressões em fila', async () => {
      mockOrderRepository.findById.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'PED-001',
        status: 'in_production',
      });
      mockPrintJobRepository.countInProgressByOrderId.mockResolvedValue(1);

      await expect(useCase.execute('order-1')).rejects.toThrow(
        'Pedido possui 1 impressões em andamento'
      );
    });
  });
});
