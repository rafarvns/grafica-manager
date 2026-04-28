import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListCustomersUseCase } from '@/application/use-cases/ListCustomersUseCase';
import { ListCustomersInput } from '@/application/dtos/ListCustomersDTO';

describe('ListCustomersUseCase', () => {
  let mockRepository: any;
  let useCase: ListCustomersUseCase;

  const mockCustomers = [
    {
      id: 'customer-1',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11987654321',
      address: 'Rua A, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
      notes: null,
      deletedAt: null,
      createdAt: new Date('2026-04-20'),
    },
    {
      id: 'customer-2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: null,
      address: null,
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: null,
      notes: null,
      deletedAt: null,
      createdAt: new Date('2026-04-21'),
    },
    {
      id: 'customer-3',
      name: 'Silva & Filhos',
      email: 'silva@example.com',
      phone: null,
      address: null,
      city: 'São Paulo',
      state: 'SP',
      zipCode: null,
      notes: null,
      deletedAt: null,
      createdAt: new Date('2026-04-22'),
    },
  ];

  beforeEach(() => {
    mockRepository = {
      findWithFilters: vi.fn(),
      countWithFilters: vi.fn(),
    };
    useCase = new ListCustomersUseCase(mockRepository);
  });

  describe('Listagem básica', () => {
    it('deve listar todos os clientes sem filtros', async () => {
      mockRepository.findWithFilters.mockResolvedValue(mockCustomers);
      mockRepository.countWithFilters.mockResolvedValue(3);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 10,
      };

      const result = await useCase.execute(input);

      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('deve retornar lista vazia se nenhum cliente existe', async () => {
      mockRepository.findWithFilters.mockResolvedValue([]);
      mockRepository.countWithFilters.mockResolvedValue(0);

      const input: ListCustomersInput = {
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
      const page1Items = [mockCustomers[0], mockCustomers[1]];
      mockRepository.findWithFilters.mockResolvedValue(page1Items);
      mockRepository.countWithFilters.mockResolvedValue(3);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 2,
      };

      const result = await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 2,
        })
      );
      expect(result.pageSize).toBe(2);
    });

    it('deve calcular skip corretamente para página 2', async () => {
      mockRepository.findWithFilters.mockResolvedValue([mockCustomers[2]]);
      mockRepository.countWithFilters.mockResolvedValue(3);

      const input: ListCustomersInput = {
        page: 2,
        pageSize: 2,
      };

      await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 2,
          take: 2,
        })
      );
    });
  });

  describe('Filtros', () => {
    it('deve filtrar por nome (case-insensitive)', async () => {
      const filtered = mockCustomers.filter((c) =>
        c.name.toLowerCase().includes('silva')
      );
      mockRepository.findWithFilters.mockResolvedValue(filtered);
      mockRepository.countWithFilters.mockResolvedValue(filtered.length);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 10,
        name: 'Silva',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Silva',
        })
      );
      expect(result.data.length).toBe(2);
    });

    it('deve filtrar por email', async () => {
      const filtered = [mockCustomers[0]];
      mockRepository.findWithFilters.mockResolvedValue(filtered);
      mockRepository.countWithFilters.mockResolvedValue(1);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 10,
        email: 'joao@example.com',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'joao@example.com',
        })
      );
      expect(result.data.length).toBe(1);
    });

    it('deve filtrar por cidade', async () => {
      const filtered = mockCustomers.filter((c) => c.city === 'São Paulo');
      mockRepository.findWithFilters.mockResolvedValue(filtered);
      mockRepository.countWithFilters.mockResolvedValue(filtered.length);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 10,
        city: 'São Paulo',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'São Paulo',
        })
      );
      expect(result.data.length).toBe(2);
    });

    it('deve combinar múltiplos filtros', async () => {
      const filtered = [mockCustomers[0]];
      mockRepository.findWithFilters.mockResolvedValue(filtered);
      mockRepository.countWithFilters.mockResolvedValue(1);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 10,
        name: 'João',
        city: 'São Paulo',
      };

      const result = await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João',
          city: 'São Paulo',
        })
      );
    });
  });

  describe('Soft-delete filtering', () => {
    it('deve excluir clientes deletados da listagem', async () => {
      mockRepository.findWithFilters.mockResolvedValue(mockCustomers);
      mockRepository.countWithFilters.mockResolvedValue(3);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 10,
      };

      await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: null,
        })
      );
    });
  });

  describe('Validação de entrada', () => {
    it('deve usar página 1 como padrão', async () => {
      mockRepository.findWithFilters.mockResolvedValue([]);
      mockRepository.countWithFilters.mockResolvedValue(0);

      const input: ListCustomersInput = {
        pageSize: 10,
      };

      await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });

    it('deve usar pageSize 10 como padrão', async () => {
      mockRepository.findWithFilters.mockResolvedValue([]);
      mockRepository.countWithFilters.mockResolvedValue(0);

      const input: ListCustomersInput = {
        page: 1,
      };

      await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('deve limitar pageSize a 100', async () => {
      mockRepository.findWithFilters.mockResolvedValue([]);
      mockRepository.countWithFilters.mockResolvedValue(0);

      const input: ListCustomersInput = {
        page: 1,
        pageSize: 200,
      };

      await useCase.execute(input);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });
});
