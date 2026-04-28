import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebhookHistory } from '@/hooks/useWebhookHistory';
import { shopeeService } from '@/services/shopeeService';

vi.mock('@/services/shopeeService', () => ({
  shopeeService: {
    getWebhooks: vi.fn(),
  },
}));

describe('useWebhookHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar webhooks iniciais', async () => {
    const mockData = { data: [{ id: '1', eventType: 'order_created' }], totalCount: 1 };
    (shopeeService.getWebhooks as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useWebhookHistory());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.webhooks).toEqual(mockData.data);
    expect(result.current.totalCount).toBe(1);
    expect(shopeeService.getWebhooks).toHaveBeenCalledWith(1, 25, {});
  });

  it('deve aplicar filtros e recarregar', async () => {
    (shopeeService.getWebhooks as any).mockResolvedValue({ data: [], totalCount: 0 });

    const { result } = renderHook(() => useWebhookHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Aplica filtro
    result.current.setFilters({ status: 'error' });

    await waitFor(() => {
      expect(shopeeService.getWebhooks).toHaveBeenCalledWith(1, 25, { status: 'error' });
    });
  });

  it('deve mudar de página', async () => {
    (shopeeService.getWebhooks as any).mockResolvedValue({ data: [], totalCount: 0 });

    const { result } = renderHook(() => useWebhookHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Muda página
    result.current.setPage(2);

    await waitFor(() => {
      expect(shopeeService.getWebhooks).toHaveBeenCalledWith(2, 25, {});
    });
  });
});
