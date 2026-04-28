import { apiClient } from './apiClient';
import { 
  ShopeeStatus, 
  WebhookEvent, 
  ErrorLogEntry, 
  SyncHistoryEntry, 
  SyncJobStatus,
  WebhooksFilters
} from '@/types/shopee';

export const shopeeService = {
  async getStatus(): Promise<ShopeeStatus> {
    const { data } = await apiClient.get<ShopeeStatus>('/shopee/status');
    return data;
  },

  async updateToken(token: string): Promise<void> {
    await apiClient.post('/shopee/token', { token });
  },

  async triggerManualSync(): Promise<{ id: string }> {
    const { data } = await apiClient.post<{ id: string }>('/shopee/sync', {});
    return data;
  },

  async getWebhooks(page: number, pageSize: number, filters: WebhooksFilters): Promise<{ data: WebhookEvent[], totalCount: number }> {
    const { data } = await apiClient.get<{ data: WebhookEvent[], totalCount: number }>('/webhooks', {
      params: {
        page,
        pageSize,
        ...filters,
      },
    });
    return data;
  },

  async reprocessWebhook(id: string): Promise<void> {
    await apiClient.post(`/webhooks/${id}/reprocess`, {});
  },

  async getErrorLogs(): Promise<ErrorLogEntry[]> {
    const { data } = await apiClient.get<ErrorLogEntry[]>('/webhooks/errors');
    return data;
  },

  async getSyncHistory(): Promise<SyncHistoryEntry[]> {
    const { data } = await apiClient.get<SyncHistoryEntry[]>('/shopee/sync-history');
    return data;
  },

  async getSyncJobStatus(jobId: string): Promise<SyncJobStatus> {
    const { data } = await apiClient.get<SyncJobStatus>(`/shopee/sync/${jobId}`);
    return data;
  }
};
