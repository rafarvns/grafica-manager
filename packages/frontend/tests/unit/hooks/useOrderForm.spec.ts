import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrderForm } from '@/hooks/useOrderForm';
import { orderService } from '@/services/OrderService';

vi.mock('@/services/OrderService', () => ({
  orderService: {
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
  },
}));

describe('useOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia com valores padrão', () => {
    const { result } = renderHook(() => useOrderForm());
    expect(result.current.formData.description).toBe('');
    expect(result.current.formData.quantity).toBe(1);
    expect(result.current.errors).toEqual({});
  });

  it('valida campos obrigatórios ao enviar', async () => {
    const { result } = renderHook(() => useOrderForm());

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(false);
    });

    expect(result.current.errors.customerId).toBeDefined();
    expect(result.current.errors.description).toBeDefined();
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it('envia formulário de criação com sucesso', async () => {
    (orderService.createOrder as any).mockResolvedValue({ id: '1' });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useOrderForm({ onSuccess }));

    act(() => {
      result.current.setFieldValue('customerId', 'cust-1');
      result.current.setFieldValue('description', 'Test Description');
      result.current.setFieldValue('quantity', 10);
      result.current.setFieldValue('paperType', 'Couchê');
      result.current.setFieldValue('dimensions', '10x10cm');
      result.current.setFieldValue('deadline', '2026-05-10');
      result.current.setFieldValue('salePrice', 100);
      result.current.setFieldValue('productionCost', 50);
    });

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(true);
    });

    expect(orderService.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'cust-1',
      description: 'Test Description',
    }));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('preenche campos para edição', () => {
    const initialOrder: any = {
      id: '1',
      customerId: 'cust-1',
      description: 'Old Description',
      quantity: 5,
      paperType: 'Couchê',
      dimensions: '10x10cm',
      deadline: '2026-05-10',
      salePrice: 100,
      productionCost: 50,
      status: 'draft',
    };

    const { result } = renderHook(() => useOrderForm({ initialOrder }));

    expect(result.current.formData.description).toBe('Old Description');
    expect(result.current.isEditing).toBe(true);
  });
});
