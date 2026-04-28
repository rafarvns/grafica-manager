import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useOrderDetail', () => {
  const mockOrder = {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'draft',
    description: 'Test Order',
    customer: { name: 'Customer 1' },
    statusHistory: [],
    files: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar os detalhes do pedido com sucesso', async () => {
    (apiClient.get as any).mockResolvedValue({ data: mockOrder });

    const { result } = renderHook(() => useOrderDetail('1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toEqual(mockOrder);
    expect(apiClient.get).toHaveBeenCalledWith('/orders/1');
  });

  it('deve lidar com erro ao carregar pedido', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Erro ao carregar'));

    const { result } = renderHook(() => useOrderDetail('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao carregar');
  });

  it('deve mudar o status do pedido', async () => {
    (apiClient.get as any).mockResolvedValue({ data: mockOrder });
    (apiClient.post as any).mockResolvedValue({ data: { ...mockOrder, status: 'scheduled' } });

    const { result } = renderHook(() => useOrderDetail('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.changeStatus('scheduled');

    expect(apiClient.post).toHaveBeenCalledWith('/orders/1/status', { status: 'scheduled' });
    
    await waitFor(() => {
      expect(result.current.order?.status).toBe('scheduled');
    });
  });
});
