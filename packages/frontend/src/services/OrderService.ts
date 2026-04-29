import { apiClient } from './apiClient';
import { 
  Order, 
  CreateOrderDTO, 
  UpdateOrderDTO, 
  OrderFilters, 
  PaginatedResult,
  OrderStatus,
  OrderAttachment
} from '@grafica/shared';

class OrderService {
  async getOrders(page: number, pageSize: number, filters: OrderFilters = {}): Promise<PaginatedResult<Order>> {
    const params: any = { page, pageSize };
    
    if (filters.statuses && filters.statuses.length > 0) {
      params.statuses = filters.statuses.join(',');
    }
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.origin && filters.origin !== 'ALL') params.origin = filters.origin;

    const response = await apiClient.get<PaginatedResult<Order>>('/orders', { params });
    return response.data;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  }

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', dto);
    return response.data;
  }

  async updateOrder(id: string, dto: UpdateOrderDTO): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}`, dto);
    return response.data;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    await apiClient.post(`/orders/${id}/status`, { status });
  }

  async uploadAttachment(orderId: string, file: File): Promise<OrderAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<OrderAttachment>(`/orders/${orderId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAttachment(orderId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/orders/${orderId}/attachments/${attachmentId}`);
  }

  async createPrintJob(orderId: string, data: any): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/print-jobs`, data);
    return response.data;
  }
}

export const orderService = new OrderService();
