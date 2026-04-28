import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import type { Order, OrderStatus } from '@grafica/shared/src/types/orders';

export function useOrderDetail(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Order>(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar pedido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id, fetchOrder]);

  const changeStatus = async (status: OrderStatus) => {
    try {
      const response = await apiClient.post<Order>(`/orders/${id}/status`, { status });
      setOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao mudar status');
      throw err;
    }
  };

  const cancelOrder = async (reason: string) => {
    try {
      const response = await apiClient.post<Order>(`/orders/${id}/cancel`, { reason });
      setOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cancelar pedido');
      throw err;
    }
  };

  const updateDescription = async (description: string) => {
    try {
      const response = await apiClient.patch<Order>(`/orders/${id}`, { description });
      setOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar descrição');
      throw err;
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient.post(`/orders/${id}/attachments`, formData);
      await fetchOrder(); // Recarrega para obter lista atualizada
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no upload do arquivo');
      throw err;
    }
  };

  const downloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await apiClient.get(`/orders/${id}/attachments/${fileId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao baixar arquivo');
      throw err;
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      await apiClient.delete(`/orders/${id}/attachments/${fileId}`);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover arquivo');
      throw err;
    }
  };

  return {
    order,
    loading,
    error,
    changeStatus,
    cancelOrder,
    updateDescription,
    uploadFile,
    downloadFile,
    removeFile,
    refresh: fetchOrder,
  };
}
