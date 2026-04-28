import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  description: string;
  quantity: number;
  salePrice: number;
  createdAt: Date;
}

export interface OrderListFilters {
  customerId?: string;
  status?: string;
  orderNumber?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderCostSummary {
  id: string;
  orderNumber: string;
  customerId: string;
  salePrice: number;
  status: string;
  totalPrintCost: number;
  printJobCount: number;
  successfulPrintCount: number;
  failedPrintCount: number;
  margin: number;
}

interface UseOrdersState {
  orders: Order[];
  costSummary: OrderCostSummary | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
}

export function useOrders() {
  const [state, setState] = useState<UseOrdersState>({
    orders: [],
    costSummary: null,
    pagination: { page: 1, pageSize: 10, total: 0 },
    loading: false,
    error: null,
  });

  const listOrders = useCallback(
    async (filters?: OrderListFilters, page: number = 1, pageSize: number = 10) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await apiClient.get<OrderListResponse>('/orders', {
          params: {
            page,
            pageSize,
            ...filters,
          },
        });
        setState((prev) => ({
          ...prev,
          orders: response.orders.map((o) => ({
            ...o,
            createdAt: new Date(o.createdAt),
          })),
          pagination: {
            page: response.page,
            pageSize: response.pageSize,
            total: response.total,
          },
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao listar pedidos';
        setState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    []
  );

  const getOrder = useCallback(async (orderId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const order = await apiClient.get<Order>(`/orders/${orderId}`);
      setState((prev) => ({
        ...prev,
        orders: [{ ...order, createdAt: new Date(order.createdAt) }],
        loading: false,
      }));
      return { ...order, createdAt: new Date(order.createdAt) };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar pedido';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const getOrderCostSummary = useCallback(async (orderId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const summary = await apiClient.get<OrderCostSummary>(`/orders/${orderId}/cost-summary`);
      setState((prev) => ({
        ...prev,
        costSummary: summary,
        loading: false,
      }));
      return summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar resumo de custos';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const createOrder = useCallback(
    async (input: {
      customerId: string;
      orderNumber: string;
      description: string;
      quantity: number;
      salePrice: number;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const order = await apiClient.post<Order>('/orders', input);
        setState((prev) => ({
          ...prev,
          orders: [...prev.orders, { ...order, createdAt: new Date(order.createdAt) }],
          loading: false,
        }));
        return { ...order, createdAt: new Date(order.createdAt) };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar pedido';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    []
  );

  const updateOrder = useCallback(
    async (
      orderId: string,
      input: {
        description?: string;
        quantity?: number;
        salePrice?: number;
      }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updated = await apiClient.patch<Order>(`/orders/${orderId}`, input);
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...updated, createdAt: new Date(updated.createdAt) } : o
          ),
          loading: false,
        }));
        return { ...updated, createdAt: new Date(updated.createdAt) };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar pedido';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    []
  );

  const changeOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updated = await apiClient.patch<Order>(`/orders/${orderId}`, { status });
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...updated, createdAt: new Date(updated.createdAt) } : o
          ),
          loading: false,
        }));
        return { ...updated, createdAt: new Date(updated.createdAt) };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao alterar status';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    []
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updated = await apiClient.post<Order>(`/orders/${orderId}/cancel`, { reason });
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...updated, createdAt: new Date(updated.createdAt) } : o
          ),
          loading: false,
        }));
        return { ...updated, createdAt: new Date(updated.createdAt) };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao cancelar pedido';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    listOrders();
  }, [listOrders]);

  return {
    orders: state.orders,
    costSummary: state.costSummary,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,
    listOrders,
    getOrder,
    getOrderCostSummary,
    createOrder,
    updateOrder,
    changeOrderStatus,
    cancelOrder,
  };
}
