import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCustomers } from '@/hooks/useCustomers';
import * as apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useCustomers', () => {
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
      createdAt: new Date('2026-04-20').toISOString(),
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
      createdAt: new Date('2026-04-21').toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Carregamento inicial', () => {
    it('deve carregar lista de clientes ao montar', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: {
          data: mockCustomers,
          total: 2,
          page: 1,
          pageSize: 10,
        },
      });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customers.length).toBe(2);
      expect(result.current.pagination.total).toBe(2);
    });

    it('deve inicializar com estado de loading', () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useCustomers());

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Listagem com filtros', () => {
    it('deve filtrar por nome', async () => {
      const filtered = [mockCustomers[0]];
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: {
          data: filtered,
          total: 1,
          page: 1,
          pageSize: 10,
        },
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.listCustomers({ name: 'João' });
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('name=Jo%C3%A3o')
      );
      expect(result.current.customers.length).toBe(1);
    });

    it('deve filtrar por cidade', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: {
          data: mockCustomers,
          total: 2,
          page: 1,
          pageSize: 10,
        },
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.listCustomers({ city: 'São Paulo' });
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('city=S%C3%A3o+Paulo')
      );
    });

    it('deve combinar múltiplos filtros', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: {
          data: [mockCustomers[0]],
          total: 1,
          page: 1,
          pageSize: 10,
        },
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.listCustomers({ name: 'João', city: 'São Paulo' });
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('name=Jo%C3%A3o')
      );
      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('city=S%C3%A3o+Paulo')
      );
    });
  });

  describe('Paginação', () => {
    it('deve aplicar paginação', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: {
          data: [mockCustomers[0]],
          total: 2,
          page: 2,
          pageSize: 1,
        },
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.listCustomers({ page: 2, pageSize: 1 });
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });

    it('deve retornar informações de paginação', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: {
          data: mockCustomers,
          total: 25,
          page: 2,
          pageSize: 10,
        },
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.listCustomers({ page: 2 });
      });

      expect(result.current.pagination.total).toBe(25);
      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.pageSize).toBe(10);
    });
  });

  describe('Criar cliente', () => {
    it('deve criar novo cliente', async () => {
      const newCustomer = {
        id: 'customer-3',
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        phone: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        notes: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue({
        data: newCustomer,
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.createCustomer({
          name: 'Pedro Costa',
          email: 'pedro@example.com',
        });
      });

      expect(apiClient.apiClient.post).toHaveBeenCalledWith('/api/customers', {
        name: 'Pedro Costa',
        email: 'pedro@example.com',
      });
    });

    it('deve validar email duplicado', async () => {
      vi.mocked(apiClient.apiClient.post).mockRejectedValue(
        new Error('Email já cadastrado')
      );

      const { result } = renderHook(() => useCustomers());

      await expect(
        result.current.createCustomer({
          name: 'João Silva',
          email: 'joao@example.com',
        })
      ).rejects.toThrow('Email já cadastrado');
    });
  });

  describe('Obter cliente', () => {
    it('deve buscar cliente por ID', async () => {
      const customerDetail = {
        ...mockCustomers[0],
        orderSummary: {
          total: 3,
          active: 1,
          completed: 2,
          cancelled: 0,
          totalValue: 1500.0,
        },
      };

      vi.mocked(apiClient.apiClient.get).mockResolvedValue({
        data: customerDetail,
      });

      const { result } = renderHook(() => useCustomers());

      let customer;
      await act(async () => {
        customer = await result.current.getCustomer('customer-1');
      });

      expect(apiClient.apiClient.get).toHaveBeenCalledWith(
        '/api/customers/customer-1'
      );
      expect(customer?.orderSummary).toBeDefined();
    });
  });

  describe('Atualizar cliente', () => {
    it('deve atualizar dados do cliente', async () => {
      const updated = {
        ...mockCustomers[0],
        name: 'João Silva Atualizado',
      };

      vi.mocked(apiClient.apiClient.patch).mockResolvedValue({
        data: updated,
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.updateCustomer('customer-1', {
          name: 'João Silva Atualizado',
        });
      });

      expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
        '/api/customers/customer-1',
        { name: 'João Silva Atualizado' }
      );
    });

    it('deve atualizar múltiplos campos', async () => {
      const updated = {
        ...mockCustomers[0],
        phone: '21999999999',
        city: 'Rio de Janeiro',
      };

      vi.mocked(apiClient.apiClient.patch).mockResolvedValue({
        data: updated,
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.updateCustomer('customer-1', {
          phone: '21999999999',
          city: 'Rio de Janeiro',
        });
      });

      expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
        '/api/customers/customer-1',
        { phone: '21999999999', city: 'Rio de Janeiro' }
      );
    });
  });

  describe('Deletar cliente', () => {
    it('deve deletar cliente', async () => {
      vi.mocked(apiClient.apiClient.delete).mockResolvedValue({
        data: { success: true, customerName: 'João Silva' },
      });

      const { result } = renderHook(() => useCustomers());

      const response = await act(async () => {
        return await result.current.deleteCustomer('customer-1');
      });

      expect(apiClient.apiClient.delete).toHaveBeenCalledWith(
        '/api/customers/customer-1'
      );
      expect(response?.success).toBe(true);
    });

    it('deve bloquear deleção se cliente tem pedidos ativos', async () => {
      vi.mocked(apiClient.apiClient.delete).mockRejectedValue(
        new Error('Cliente possui 2 pedidos ativos')
      );

      const { result } = renderHook(() => useCustomers());

      await expect(
        result.current.deleteCustomer('customer-1')
      ).rejects.toThrow('Cliente possui 2 pedidos ativos');
    });
  });

  describe('Restaurar cliente', () => {
    it('deve restaurar cliente deletado', async () => {
      const restored = {
        id: 'customer-1',
        name: 'João Silva',
        email: 'joao@example.com',
        deletedAt: null,
      };

      vi.mocked(apiClient.apiClient.post).mockResolvedValue({
        data: restored,
      });

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.restoreCustomer('customer-1');
      });

      expect(apiClient.apiClient.post).toHaveBeenCalledWith(
        '/api/customers/customer-1/restore'
      );
    });
  });

  describe('Gerenciamento de erros', () => {
    it('deve capturar erros de rede', async () => {
      vi.mocked(apiClient.apiClient.get).mockRejectedValue(
        new Error('Erro de conexão')
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('deve limpar erro ao fazer nova requisição bem-sucedida', async () => {
      vi.mocked(apiClient.apiClient.get)
        .mockRejectedValueOnce(new Error('Erro'))
        .mockResolvedValueOnce({
          data: {
            data: mockCustomers,
            total: 2,
            page: 1,
            pageSize: 10,
          },
        });

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      await act(async () => {
        await result.current.listCustomers();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
