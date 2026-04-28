import { useState, useEffect, useCallback } from 'react';
import { WebhookEvent, WebhooksFilters } from '@/types/shopee';
import { shopeeService } from '@/services/shopeeService';

export function useWebhookHistory(initialPage = 1, pageSize = 25) {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<WebhooksFilters>({});

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await shopeeService.getWebhooks(page, pageSize, filters);
      setWebhooks(response.data);
      setTotalCount(response.totalCount);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar histórico de webhooks');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    totalCount,
    loading,
    error,
    page,
    setPage,
    filters,
    setFilters,
    refresh: fetchWebhooks,
  };
}
