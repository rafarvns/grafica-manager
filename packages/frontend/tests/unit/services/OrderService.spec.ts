import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '@/services/OrderService';
import { apiClient } from '@/services/apiClient';
import { CreateOrderDTO, UpdateOrderDTO, OrderFilters } from '@grafica/shared';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista pedidos com filtros', async () => {
    const mockOrders = { data: [{ id: '1', orderNumber: 'ORD-001' }], total: 1 };
    (apiClient.get as any).mockResolvedValue({ data: mockOrders });

    const filters: OrderFilters = { statuses: ['draft'], origin: 'MANUAL' };
    const result = await orderService.getOrders(1, 10, filters);

    expect(apiClient.get).toHaveBeenCalledWith('/orders', {
      params: expect.objectContaining({
        page: 1,
        pageSize: 10,
        statuses: 'draft',
        origin: 'MANUAL',
      }),
    });
    expect(result).toEqual(mockOrders);
  });

  it('cria um novo pedido', async () => {
    const mockOrder = { id: '1', orderNumber: 'ORD-001' };
    (apiClient.post as any).mockResolvedValue({ data: mockOrder });

    const dto: CreateOrderDTO = {
      customerId: 'cust-1',
      description: 'Test Order',
      quantity: 1,
      paperType: 'Couchê',
      dimensions: '10x10',
      deadline: '2026-05-01',
      salePrice: 100,
      productionCost: 50,
    };

    const result = await orderService.createOrder(dto);

    expect(apiClient.post).toHaveBeenCalledWith('/orders', dto);
    expect(result).toEqual(mockOrder);
  });

  it('atualiza um pedido', async () => {
    const mockOrder = { id: '1', orderNumber: 'ORD-001' };
    (apiClient.patch as any).mockResolvedValue({ data: mockOrder });

    const dto: UpdateOrderDTO = { description: 'Updated' };
    const result = await orderService.updateOrder('1', dto);

    expect(apiClient.patch).toHaveBeenCalledWith('/orders/1', dto);
    expect(result).toEqual(mockOrder);
  });

  it('atualiza o status de um pedido', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });

    await orderService.updateOrderStatus('1', 'in_production');

    expect(apiClient.post).toHaveBeenCalledWith('/orders/1/status', { status: 'in_production' });
  });

  it('faz upload de anexo', async () => {
    const mockAttachment = { id: 'att-1', name: 'file.pdf' };
    (apiClient.post as any).mockResolvedValue({ data: mockAttachment });

    const file = new File([''], 'file.pdf', { type: 'application/pdf' });
    const result = await orderService.uploadAttachment('1', file);

    expect(apiClient.post).toHaveBeenCalledWith('/orders/1/attachments', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(result).toEqual(mockAttachment);
  });

  it('remove um anexo', async () => {
    (apiClient.delete as any).mockResolvedValue({ data: { success: true } });

    await orderService.deleteAttachment('1', 'att-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/orders/1/attachments/att-1');
  });
});
