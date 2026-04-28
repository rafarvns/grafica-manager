import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useShopeeStatus } from '@/hooks/useShopeeStatus';
import { shopeeService } from '@/services/shopeeService';

vi.mock('@/services/shopeeService', () => ({
  shopeeService: {
    getStatus: vi.fn(),
  },
}));

describe('useShopeeStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar o status inicial', async () => {
    const mockStatus = { isActive: true, tokenConfigured: true, successRate: 100, queuedWebhooks: 0 };
    (shopeeService.getStatus as any).mockResolvedValue(mockStatus);

    const { result } = renderHook(() => useShopeeStatus());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    expect(result.current.status).toEqual(mockStatus);
    expect(shopeeService.getStatus).toHaveBeenCalledTimes(1);
  });

  it('deve lidar com erro no carregamento', async () => {
    (shopeeService.getStatus as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useShopeeStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    expect(result.current.error).toBe('Erro ao carregar status da integração');
  });

  describe('polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve atualizar o status periodicamente', async () => {
      const mockStatus = { isActive: true, tokenConfigured: true, successRate: 100, queuedWebhooks: 0 };
      (shopeeService.getStatus as any).mockResolvedValue(mockStatus);

      renderHook(() => useShopeeStatus(5000));

      // Espera a primeira chamada (no mount)
      // Como estamos com fake timers, precisamos avançar ou rodar os timers
      await vi.runOnlyPendingTimersAsync();
      
      expect(shopeeService.getStatus).toHaveBeenCalled();
      const initialCalls = (shopeeService.getStatus as any).mock.calls.length;

      // Avança o tempo em 5 segundos
      vi.advanceTimersByTime(5000);
      await vi.runOnlyPendingTimersAsync();

      expect((shopeeService.getStatus as any).mock.calls.length).toBeGreaterThanOrEqual(initialCalls + 1);
    });
  });
});
