import { useState, useEffect, useCallback } from 'react';
import { Order, OrderFilters, OrderStatus } from '@grafica/shared';
import { orderService } from '@/services/OrderService';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filters, setFilters] = useState<OrderFilters>({});

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrders(page, pageSize, filters);
      setOrders(result.data);
      setTotalCount(result.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSetFilters = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 when filtering
  }, []);

  const moveOrder = useCallback(async (orderId: string, newStatus: OrderStatus, newPosition?: number) => {
    try {
      if (newPosition !== undefined) {
        await orderService.updateOrder(orderId, { status: newStatus, position: newPosition });
      } else {
        await orderService.updateOrderStatus(orderId, newStatus);
      }
      await fetchOrders(); // Refresh after move
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover pedido');
      throw err;
    }
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    page,
    setPage,
    pageSize,
    totalCount,
    view,
    setView,
    filters,
    setFilters: handleSetFilters,
    refresh: fetchOrders,
    moveOrder,
  };
}
