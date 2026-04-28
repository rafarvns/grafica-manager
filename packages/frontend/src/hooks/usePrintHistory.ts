import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';

export type PrintStatus = 'sucesso' | 'erro' | 'cancelada';

export interface PrintJob {
  id: string;
  documentName: string;
  paperTypeId: string;
  quality: string;
  colorMode: string;
  dpi: number;
  pageCount: number;
  status: PrintStatus;
  registeredCost: number;
  errorMessage?: string;
  orderId?: string;
  createdAt: Date;
}

export interface PrintFilters {
  startDate?: Date;
  endDate?: Date;
  status?: PrintStatus;
  orderId?: string;
  documentName?: string;
}

export interface PriceTableEntry {
  id: string;
  paperTypeId: string;
  quality: 'rascunho' | 'normal' | 'alta';
  unitPrice: number;
  createdAt: Date;
}

interface UsePrintHistoryReturn {
  // Estado
  printJobs: PrintJob[];
  priceTable: PriceTableEntry[];
  loading: boolean;
  error: string | null;

  // Filtros e consultas
  filters: PrintFilters;
  setFilters: (filters: PrintFilters) => void;
  fetchPrintHistory: (filters?: PrintFilters) => Promise<void>;
  fetchPrintJobById: (id: string) => Promise<PrintJob | null>;

  // Tabela de preços
  createPriceEntry: (paperTypeId: string, quality: string, unitPrice: number) => Promise<void>;
  updatePriceEntry: (id: string, unitPrice: number) => Promise<void>;
  deletePriceEntry: (id: string) => Promise<void>;
  fetchPriceTable: () => Promise<void>;

  // Cálculos
  getTotalCost: (jobs: PrintJob[]) => number;
  getSuccessRate: (jobs: PrintJob[]) => number;
  getPriceForPaperTypeAndQuality: (
    paperTypeId: string,
    quality: string
  ) => PriceTableEntry | null;
}

export function usePrintHistory(): UsePrintHistoryReturn {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [priceTable, setPriceTable] = useState<PriceTableEntry[]>([]);
  const [filters, setFilters] = useState<PrintFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar histórico de impressões
  const fetchPrintHistory = useCallback(async (appliedFilters?: PrintFilters) => {
    try {
      setLoading(true);
      setError(null);

      const queryFilters = appliedFilters || filters;
      const params = new URLSearchParams();

      if (queryFilters.startDate) {
        params.append('startDate', queryFilters.startDate.toISOString());
      }
      if (queryFilters.endDate) {
        params.append('endDate', queryFilters.endDate.toISOString());
      }
      if (queryFilters.status) {
        params.append('status', queryFilters.status);
      }
      if (queryFilters.orderId) {
        params.append('orderId', queryFilters.orderId);
      }
      if (queryFilters.documentName) {
        params.append('documentName', queryFilters.documentName);
      }

      const response = await apiClient.get(`/api/print-jobs?${params.toString()}`);
      const jobs = (response.data || []).map((job: any) => ({
        ...job,
        createdAt: new Date(job.createdAt),
      }));

      setPrintJobs(jobs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar histórico';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Carregar tabela de preços
  const fetchPriceTable = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/api/price-table');
      const entries = (response.data || []).map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
      }));
      setPriceTable(entries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tabela de preços';
      setError(errorMessage);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchPrintHistory();
    fetchPriceTable();
  }, []);

  const fetchPrintJobById = useCallback(async (id: string): Promise<PrintJob | null> => {
    try {
      setError(null);
      const response = await apiClient.get(`/api/print-jobs/${id}`);
      return {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar impressão';
      setError(errorMessage);
      return null;
    }
  }, []);

  const createPriceEntry = useCallback(
    async (paperTypeId: string, quality: string, unitPrice: number) => {
      try {
        setError(null);
        const response = await apiClient.post('/api/price-table', {
          paperTypeId,
          quality,
          unitPrice,
        });
        const newEntry: PriceTableEntry = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
        };
        setPriceTable((prev) => [...prev, newEntry]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar preço';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const updatePriceEntry = useCallback(async (id: string, unitPrice: number) => {
    try {
      setError(null);
      const response = await apiClient.patch(`/api/price-table/${id}`, { unitPrice });
      const updated: PriceTableEntry = {
        ...response.data,
        createdAt: new Date(response.data.createdAt),
      };
      setPriceTable((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar preço';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deletePriceEntry = useCallback(async (id: string) => {
    try {
      setError(null);
      await apiClient.delete(`/api/price-table/${id}`);
      setPriceTable((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar preço';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getTotalCost = useCallback((jobs: PrintJob[]) => {
    return jobs.reduce((sum, job) => sum + job.registeredCost, 0);
  }, []);

  const getSuccessRate = useCallback((jobs: PrintJob[]) => {
    if (jobs.length === 0) return 0;
    const successCount = jobs.filter((job) => job.status === 'sucesso').length;
    return (successCount / jobs.length) * 100;
  }, []);

  const getPriceForPaperTypeAndQuality = useCallback(
    (paperTypeId: string, quality: string): PriceTableEntry | null => {
      return (
        priceTable.find(
          (entry) => entry.paperTypeId === paperTypeId && entry.quality === quality
        ) || null
      );
    },
    [priceTable]
  );

  return {
    printJobs,
    priceTable,
    loading,
    error,
    filters,
    setFilters,
    fetchPrintHistory,
    fetchPrintJobById,
    createPriceEntry,
    updatePriceEntry,
    deletePriceEntry,
    fetchPriceTable,
    getTotalCost,
    getSuccessRate,
    getPriceForPaperTypeAndQuality,
  };
}
