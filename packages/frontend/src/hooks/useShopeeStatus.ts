import { useState, useEffect, useCallback } from 'react';
import { ShopeeStatus } from '@/types/shopee';
import { shopeeService } from '@/services/shopeeService';

export function useShopeeStatus(pollingInterval = 0) {
  const [status, setStatus] = useState<ShopeeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await shopeeService.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar status da integração');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    if (pollingInterval > 0) {
      const interval = setInterval(fetchStatus, pollingInterval);
      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [fetchStatus, pollingInterval]);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
  };
}
