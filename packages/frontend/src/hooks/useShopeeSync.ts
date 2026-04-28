import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncJobStatus } from '@/types/shopee';
import { shopeeService } from '@/services/shopeeService';

export function useShopeeSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [jobStatus, setJobStatus] = useState<SyncJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const status = await shopeeService.getSyncJobStatus(jobId);
      setJobStatus(status);
      
      if (status.status === 'completed' || status.status === 'failed') {
        setIsSyncing(false);
        stopPolling();
      }
    } catch (err) {
      setError('Erro ao verificar status da sincronização');
      setIsSyncing(false);
      stopPolling();
    }
  }, [stopPolling]);

  const startSync = useCallback(async () => {
    setError(null);
    setJobStatus(null);
    try {
      const { id } = await shopeeService.triggerManualSync();
      setIsSyncing(true);
      
      // Inicia polling a cada 1s
      pollingIntervalRef.current = setInterval(() => pollStatus(id), 1000);
    } catch (err) {
      setError('Erro ao iniciar sincronização');
    }
  }, [pollStatus]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    isSyncing,
    progress: jobStatus?.progress ?? 0,
    processed: jobStatus?.processed ?? 0,
    total: jobStatus?.total ?? 0,
    status: jobStatus?.status ?? 'pending',
    error,
    startSync,
  };
}
