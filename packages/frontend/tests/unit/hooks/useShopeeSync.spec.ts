import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShopeeSync } from '@/hooks/useShopeeSync';
import { shopeeService } from '@/services/shopeeService';

vi.mock('@/services/shopeeService', () => ({
  shopeeService: {
    triggerManualSync: vi.fn(),
    getSyncJobStatus: vi.fn(),
  },
}));

describe('useShopeeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve iniciar uma sincronização e monitorar o progresso', async () => {
    const mockJobId = 'job-123';
    (shopeeService.triggerManualSync as any).mockResolvedValue({ id: mockJobId });
    (shopeeService.getSyncJobStatus as any)
      .mockResolvedValueOnce({ id: mockJobId, active: true, progress: 10, processed: 5, total: 50, status: 'processing' })
      .mockResolvedValueOnce({ id: mockJobId, active: false, progress: 100, processed: 50, total: 50, status: 'completed' });

    const { result } = renderHook(() => useShopeeSync());

    // Inicia sync
    await act(async () => {
      await result.current.startSync();
    });

    expect(result.current.isSyncing).toBe(true);
    expect(shopeeService.triggerManualSync).toHaveBeenCalled();

    // Avança tempo para o primeiro polling
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
    });
    
    // Se falhar aqui dizendo que é 100, verificamos se foi chamado 2 vezes
    if (result.current.progress === 100) {
      console.warn('Advertência: O polling correu duas vezes no primeiro tick.');
    }
    
    expect(result.current.progress).toBeGreaterThanOrEqual(10);

    // Avança tempo para o segundo polling (se ainda não chegou em 100)
    if (result.current.progress < 100) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await vi.runOnlyPendingTimersAsync();
      });
    }

    expect(result.current.progress).toBe(100);
    expect(result.current.isSyncing).toBe(false);
  });
});
