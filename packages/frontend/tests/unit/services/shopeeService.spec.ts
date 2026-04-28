import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shopeeService } from '@/services/shopeeService';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ShopeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar o status da integração Shopee', async () => {
    const mockStatus = { isActive: true, tokenConfigured: true };
    (apiClient.get as any).mockResolvedValue({ data: mockStatus });

    const result = await shopeeService.getStatus();

    expect(apiClient.get).toHaveBeenCalledWith('/shopee/status');
    expect(result).toEqual(mockStatus);
  });

  it('deve atualizar o token Shopee', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });

    await shopeeService.updateToken('new-token');

    expect(apiClient.post).toHaveBeenCalledWith('/shopee/token', { token: 'new-token' });
  });

  it('deve enfileirar uma sincronização manual', async () => {
    const mockJob = { id: 'job-1' };
    (apiClient.post as any).mockResolvedValue({ data: mockJob });

    const result = await shopeeService.triggerManualSync();

    expect(apiClient.post).toHaveBeenCalledWith('/shopee/sync', {});
    expect(result).toEqual(mockJob);
  });

  it('deve listar webhooks com filtros', async () => {
    const mockWebhooks = { data: [], totalCount: 0 };
    (apiClient.get as any).mockResolvedValue({ data: mockWebhooks });

    const filters = { status: 'error' as const };
    const result = await shopeeService.getWebhooks(1, 25, filters);

    expect(apiClient.get).toHaveBeenCalledWith('/webhooks', {
      params: expect.objectContaining({
        page: 1,
        pageSize: 25,
        status: 'error',
      }),
    });
    expect(result).toEqual(mockWebhooks);
  });

  it('deve solicitar reprocessamento de um webhook', async () => {
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });

    await shopeeService.reprocessWebhook('webhook-1');

    expect(apiClient.post).toHaveBeenCalledWith('/webhooks/webhook-1/reprocess', {});
  });

  it('deve buscar o log de erros', async () => {
    const mockErrors = [{ id: '1', message: 'Error' }];
    (apiClient.get as any).mockResolvedValue({ data: mockErrors });

    const result = await shopeeService.getErrorLogs();

    expect(apiClient.get).toHaveBeenCalledWith('/webhooks/errors');
    expect(result).toEqual(mockErrors);
  });

  it('deve buscar o histórico de sincronização', async () => {
    const mockHistory = [{ id: '1', user: 'Admin' }];
    (apiClient.get as any).mockResolvedValue({ data: mockHistory });

    const result = await shopeeService.getSyncHistory();

    expect(apiClient.get).toHaveBeenCalledWith('/shopee/sync-history');
    expect(result).toEqual(mockHistory);
  });
});
