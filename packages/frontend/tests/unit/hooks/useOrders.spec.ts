import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrders } from '@/hooks/useOrders';
import { orderService } from '@/services/OrderService';

vi.mock('@/services/OrderService', () => ({
  orderService: {
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

describe('useOrders', () => {
  const mockOrdersResult = {
    data: [{ id: '1', orderNumber: 'ORD-001', status: 'draft' }],
    total: 1,
    page: 1,
    pageSize: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (orderService.getOrders as any).mockResolvedValue(mockOrdersResult);
  });

  it('carrega pedidos ao montar', async () => {
    const { result } = renderHook(() => useOrders());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrdersResult.data);
    expect(orderService.getOrders).toHaveBeenCalled();
  });

  it('muda de página e recarrega', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(orderService.getOrders).toHaveBeenCalledWith(2, 25, expect.any(Object));
  });

  it('atualiza filtros e recarrega na página 1', async () => {
    const { result } = renderHook(() => useOrders());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setFilters({ statuses: ['in_production'] });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(orderService.getOrders).toHaveBeenCalledWith(1, 25, { statuses: ['in_production'] });
  });

  it('alterna visualização entre kanban e list', () => {
    const { result } = renderHook(() => useOrders());

    expect(result.current.view).toBe('kanban');

    act(() => {
      result.current.setView('list');
    });

    expect(result.current.view).toBe('list');
  });

  it('atualiza status de um pedido via drag and drop', async () => {
    (orderService.updateOrderStatus as any).mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveOrder('1', 'scheduled');
    });

    expect(orderService.updateOrderStatus).toHaveBeenCalledWith('1', 'scheduled');
    expect(orderService.getOrders).toHaveBeenCalledTimes(2); // Initial + Refresh after move
  });
});
