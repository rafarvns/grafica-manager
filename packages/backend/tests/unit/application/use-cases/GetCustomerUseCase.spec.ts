import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetCustomerUseCase } from '@/application/use-cases/GetCustomerUseCase';

describe('GetCustomerUseCase', () => {
  let mockCustomerRepository: any;
  let mockOrderRepository: any;
  let useCase: GetCustomerUseCase;

  const mockCustomer = {
    id: 'customer-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11987654321',
    address: 'Rua A, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    notes: 'Cliente VIP',
    deletedAt: null,
    createdAt: new Date('2026-04-20'),
  };

  const mockOrderSummary = {
    total: 5,
    active: 1,
    completed: 3,
    cancelled: 1,
    totalValue: 1500.00,
  };

  beforeEach(() => {
    mockCustomerRepository = {
      findById: vi.fn(),
    };
    mockOrderRepository = {
      getOrderSummaryByCustomerId: vi.fn(),
    };
    useCase = new GetCustomerUseCase(mockCustomerRepository, mockOrderRepository);
  });

  describe('Busca de cliente', () => {
    it('deve retornar cliente se encontrado', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result.id).toBe('customer-1');
      expect(result.name).toBe('João Silva');
      expect(result.email).toBe('joao@example.com');
    });

    it('deve bloquear busca se cliente não existe', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(
        'Cliente não encontrado'
      );
    });

    it('deve incluir todos os campos do cliente', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result.phone).toBe('11987654321');
      expect(result.address).toBe('Rua A, 123');
      expect(result.city).toBe('São Paulo');
      expect(result.state).toBe('SP');
      expect(result.zipCode).toBe('01000-000');
      expect(result.notes).toBe('Cliente VIP');
      expect(result.createdAt).toEqual(mockCustomer.createdAt);
    });
  });

  describe('Resumo de pedidos', () => {
    it('deve incluir resumo de pedidos na resposta', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result.orderSummary).toBeDefined();
      expect(result.orderSummary.total).toBe(5);
      expect(result.orderSummary.active).toBe(1);
      expect(result.orderSummary.completed).toBe(3);
      expect(result.orderSummary.cancelled).toBe(1);
    });

    it('deve incluir valor total de pedidos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result.orderSummary.totalValue).toBe(1500.00);
    });

    it('deve buscar resumo de pedidos para o cliente correto', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      await useCase.execute('customer-1');

      expect(mockOrderRepository.getOrderSummaryByCustomerId).toHaveBeenCalledWith(
        'customer-1'
      );
    });

    it('deve retornar resumo vazio se cliente não tem pedidos', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue({
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        totalValue: 0,
      });

      const result = await useCase.execute('customer-1');

      expect(result.orderSummary.total).toBe(0);
      expect(result.orderSummary.active).toBe(0);
      expect(result.orderSummary.totalValue).toBe(0);
    });
  });

  describe('Status de deleção', () => {
    it('deve incluir deletedAt null para cliente ativo', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result.deletedAt).toBeNull();
    });

    it('deve permitir buscar cliente deletado (soft-delete)', async () => {
      const deletedCustomer = {
        ...mockCustomer,
        deletedAt: new Date('2026-04-20'),
      };
      mockCustomerRepository.findById.mockResolvedValue(deletedCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result.deletedAt).not.toBeNull();
    });
  });

  describe('Formato de resposta', () => {
    it('deve retornar objeto com estrutura completa', async () => {
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockOrderRepository.getOrderSummaryByCustomerId.mockResolvedValue(
        mockOrderSummary
      );

      const result = await useCase.execute('customer-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('zipCode');
      expect(result).toHaveProperty('notes');
      expect(result).toHaveProperty('orderSummary');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('deletedAt');
    });
  });
});
