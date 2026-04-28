import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteCustomerUseCase } from '@/application/use-cases/DeleteCustomerUseCase';

describe('DeleteCustomerUseCase', () => {
  let mockCustomerRepository: any;
  let mockOrderRepository: any;
  let useCase: DeleteCustomerUseCase;

  const existingCustomer = {
    id: 'customer-1',
    name: 'João Silva',
    email: 'joao@example.com',
    deletedAt: null,
  };

  beforeEach(() => {
    mockCustomerRepository = {
      findById: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
    };
    mockOrderRepository = {
      countActiveByCustomerId: vi.fn(),
    };
    useCase = new DeleteCustomerUseCase(mockCustomerRepository, mockOrderRepository);
  });

  describe('Validação de existência', () => {
    it('deve bloquear deleção se cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Cliente não encontrado'
      );
    });

    it('deve permitir deleção se cliente existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date(),
      });

      const result = await useCase.execute('customer-1');

      expect(result.success).toBe(true);
      expect(mockCustomerRepository.softDelete).toHaveBeenCalledWith('customer-1');
    });
  });

  describe('Bloqueio por pedidos ativos', () => {
    it('deve bloquear deleção se cliente tem pedidos ativos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(2);

      await expect(useCase.execute('customer-1')).rejects.toThrow(
        'Cliente possui 2 pedidos ativos'
      );
    });

    it('deve permitir deleção se não há pedidos ativos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date(),
      });

      const result = await useCase.execute('customer-1');

      expect(result.success).toBe(true);
    });

    it('deve permitir deleção se apenas pedidos cancelados/concluídos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date(),
      });

      const result = await useCase.execute('customer-1');

      expect(result.success).toBe(true);
      expect(mockOrderRepository.countActiveByCustomerId).toHaveBeenCalledWith('customer-1');
    });
  });

  describe('Soft-delete', () => {
    it('deve executar soft-delete ao deletar', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date('2026-04-27T10:00:00Z'),
      });

      const result = await useCase.execute('customer-1');

      expect(mockCustomerRepository.softDelete).toHaveBeenCalledWith('customer-1');
      expect(result.deletedAt).toBeDefined();
    });

    it('deve manter histórico de pedidos após soft-delete', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date(),
      });

      await useCase.execute('customer-1');

      // A verificação de que o método softDelete foi chamado garante que não é um hard delete
      expect(mockCustomerRepository.softDelete).toHaveBeenCalled();
    });
  });

  describe('Restauração (restore)', () => {
    it('deve restaurar cliente deletado', async () => {
      const deletedCustomer = {
        ...existingCustomer,
        deletedAt: new Date('2026-04-20'),
      };
      mockCustomerRepository.findById.mockResolvedValue(deletedCustomer);
      mockCustomerRepository.restore.mockResolvedValue({
        ...deletedCustomer,
        deletedAt: null,
      });

      const result = await useCase.restore('customer-1');

      expect(mockCustomerRepository.restore).toHaveBeenCalledWith('customer-1');
      expect(result.deletedAt).toBeNull();
    });

    it('deve bloquear restauração se cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(useCase.restore('non-existent')).rejects.toThrow(
        'Cliente não encontrado'
      );
    });

    it('deve bloquear restauração de cliente não deletado', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);

      await expect(useCase.restore('customer-1')).rejects.toThrow(
        'Cliente não foi deletado'
      );
    });
  });

  describe('Retorno de informações', () => {
    it('deve retornar success true ao deletar com sucesso', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date(),
      });

      const result = await useCase.execute('customer-1');

      expect(result.success).toBe(true);
    });

    it('deve retornar customerName ao deletar', async () => {
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: new Date(),
      });

      const result = await useCase.execute('customer-1');

      expect(result.customerName).toBe('João Silva');
    });

    it('deve retornar deletedAt timestamp', async () => {
      const now = new Date();
      mockCustomerRepository.findById.mockResolvedValue(existingCustomer);
      mockOrderRepository.countActiveByCustomerId.mockResolvedValue(0);
      mockCustomerRepository.softDelete.mockResolvedValue({
        ...existingCustomer,
        deletedAt: now,
      });

      const result = await useCase.execute('customer-1');

      expect(result.deletedAt).toEqual(now);
    });
  });
});
