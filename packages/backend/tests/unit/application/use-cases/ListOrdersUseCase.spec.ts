import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListOrdersUseCase } from '@/application/use-cases/ListOrdersUseCase';
import { ListOrdersInput } from '@/application/dtos/ListOrdersDTO';

describe('ListOrdersUseCase', () => {
  let mockOrderRepository: any;
  let useCase: ListOrdersUseCase;

  const mockOrders = [
    {
      id: 'order-1',
      orderNumber: 'PED-001',
      customerId: 'customer-1',
      description: 'Design A',
      quantity: 100,
      status: 'draft',
      createdAt: new Date('2026-04-25'),
    },
    {
      id: 'order-2',
      orderNumber: 'PED-002',
      customerId: 'customer-2',
      description: 'Design B',
      quantity: 200,
      status: 'in_production',
      createdAt: new Date('2026-04-26'),
    },
  ];

  beforeEach(() => {
    mockOrderRepository = {
      findWithFilters: vi.fn(),
      countWithFilters: vi.fn(),
    };
    useCase = new ListOrdersUseCase(mockOrderRepository);
  });

  describe('Listagem básica', () => {
    it('deve listar todos os pedidos sem filtros', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue(mockOrders);
      mockOrderRepository.countWithFilters.mockResolvedValue(2);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
      };

      const result = await useCase.execute(input);

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('deve retornar lista vazia se nenhum pedido existe', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([]);
      mockOrderRepository.countWithFilters.mockResolvedValue(0);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
      };

      const result = await useCase.execute(input);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Paginação', () => {
    it('deve aplicar paginação corretamente', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([mockOrders[0]]);
      mockOrderRepository.countWithFilters.mockResolvedValue(2);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 1,
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 1,
        })
      );
    });

    it('deve calcular skip corretamente para página 2', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([mockOrders[1]]);
      mockOrderRepository.countWithFilters.mockResolvedValue(2);

      const input: ListOrdersInput = {
        page: 2,
        pageSize: 1,
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
        })
      );
    });

    it('deve usar valores padrão de paginação', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue(mockOrders);
      mockOrderRepository.countWithFilters.mockResolvedValue(2);

      const input: ListOrdersInput = {};

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('deve limitar pageSize a 100', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([]);
      mockOrderRepository.countWithFilters.mockResolvedValue(0);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 200,
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  describe('Filtros', () => {
    it('deve filtrar por cliente', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([mockOrders[0]]);
      mockOrderRepository.countWithFilters.mockResolvedValue(1);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
        customerId: 'customer-1',
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
        })
      );
    });

    it('deve filtrar por status', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([mockOrders[1]]);
      mockOrderRepository.countWithFilters.mockResolvedValue(1);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
        status: 'in_production',
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_production',
        })
      );
    });

    it('deve filtrar por período (startDate e endDate)', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue(mockOrders);
      mockOrderRepository.countWithFilters.mockResolvedValue(2);

      const startDate = new Date('2026-04-25');
      const endDate = new Date('2026-04-26');

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
        startDate,
        endDate,
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      );
    });

    it('deve filtrar por número do pedido', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([mockOrders[0]]);
      mockOrderRepository.countWithFilters.mockResolvedValue(1);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
        orderNumber: 'PED-001',
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'PED-001',
        })
      );
    });

    it('deve combinar múltiplos filtros', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([mockOrders[0]]);
      mockOrderRepository.countWithFilters.mockResolvedValue(1);

      const input: ListOrdersInput = {
        page: 1,
        pageSize: 10,
        customerId: 'customer-1',
        status: 'draft',
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
          status: 'draft',
        })
      );
    });
  });

  describe('Validação de entrada', () => {
    it('deve validar período válido', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([]);
      mockOrderRepository.countWithFilters.mockResolvedValue(0);

      const startDate = new Date('2026-04-26');
      const endDate = new Date('2026-04-25');

      const input: ListOrdersInput = {
        startDate,
        endDate,
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'startDate não pode ser posterior a endDate'
      );
    });

    it('deve validar status válido', async () => {
      const input: ListOrdersInput = {
        status: 'invalid_status' as any,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Status inválido');
    });
  });

  describe('Valores padrão', () => {
    it('deve usar página 1 como padrão', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([]);
      mockOrderRepository.countWithFilters.mockResolvedValue(0);

      const input: ListOrdersInput = {
        pageSize: 10,
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });

    it('deve usar pageSize 10 como padrão', async () => {
      mockOrderRepository.findWithFilters.mockResolvedValue([]);
      mockOrderRepository.countWithFilters.mockResolvedValue(0);

      const input: ListOrdersInput = {
        page: 1,
      };

      await useCase.execute(input);

      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });
});
