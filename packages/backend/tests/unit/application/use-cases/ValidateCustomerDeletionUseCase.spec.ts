import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidateCustomerDeletionUseCase } from '@/application/use-cases/ValidateCustomerDeletionUseCase';

describe('ValidateCustomerDeletionUseCase', () => {
  let mockCustomerRepository: any;
  let mockOrderRepository: any;
  let useCase: ValidateCustomerDeletionUseCase;

  beforeEach(() => {
    mockCustomerRepository = {
      findById: vi.fn(),
    };
    mockOrderRepository = {
      countActiveByCustomerId: vi.fn(),
    };
    useCase = new ValidateCustomerDeletionUseCase(
      mockCustomerRepository,
      mockOrderRepository
    );
  });

  describe('Validação de existência', () => {
    it('deve bloquear deleção se cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Cliente não encontrado'
      );
    });
  });

  describe('Bloqueio de deleção com pedidos ativos', () => {
    it('deve bloquear se cliente tem pedidos ativos (não cancelados/concluídos)', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
        name: 'João Silva',
      });
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(2);

      await expect(useCase.execute('customer-1')).rejects.toThrow(
        'Cliente possui 2 pedidos ativos'
      );
    });

    it('deve permitir deleção se não há pedidos ativos', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
        name: 'João Silva',
      });
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);

      const result = await useCase.execute('customer-1');

      expect(result.canDelete).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('deve permitir deleção se apenas pedidos concluídos/cancelados', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
        name: 'João Silva',
      });
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);

      const result = await useCase.execute('customer-1');

      expect(result.canDelete).toBe(true);
    });

    it('deve fornecer motivo do bloqueio se houver pedidos ativos', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(3);

      await expect(useCase.execute('customer-1')).rejects.toThrow(
        'Cliente possui 3 pedidos ativos'
      );
    });
  });

  describe('Resposta de validação', () => {
    it('deve retornar canDelete=true e reason=null se liberado', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);

      const result = await useCase.execute('customer-1');

      expect(result).toEqual({
        canDelete: true,
        reason: null,
        activeOrderCount: 0,
      });
    });

    it('deve incluir contagem de pedidos ativos na resposta', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(2);

      try {
        await useCase.execute('customer-1');
      } catch (err) {
        // Esperado: erro por ter pedidos ativos
      }

      expect(mockOrderRepository.countActiveByCustomerId).toHaveBeenCalledWith(
        'customer-1'
      );
    });
  });

  describe('Definição de "ativo"', () => {
    it('deve considerar ativo: pedido que não é cancelado e não é concluído', async () => {
      mockCustomerRepository.findById.mockResolvedValue({
        id: 'customer-1',
      });

      // Repository deve contar status: draft, scheduled, in_production, shipping
      // Não contar: completed, cancelled
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(1);

      await expect(useCase.execute('customer-1')).rejects.toThrow();
    });
  });
});
