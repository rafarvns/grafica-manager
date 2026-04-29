import { useState, useEffect, useCallback, useRef } from 'react';
import { printJobService } from '@/services/printJobService';
import { priceTableService } from '@/services/priceTableService';
import { paperTypeService, PaperType } from '@/services/paperTypeService';
import type {
  PrintJobDTO,
  PrintJobDetailDTO,
  PrintJobFilters,
  PrintJobStats,
  PrintJobSortField,
  SortOrder,
  PaginatedPrintJobs,
  ExportFormat,
  CreatePriceTableEntryDTO,
  UpdatePriceTableEntryDTO,
} from '@grafica/shared/types';

export type { PrintJobDTO as PrintJob, PrintJobDetailDTO as PrintJobDetail, PrintJobFilters, PrintJobSortField, SortOrder };

export type PrintStatus = 'sucesso' | 'erro' | 'cancelada' | 'pendente';

interface UsePrintHistoryReturn {
  // Estado
  printJobs: PrintJobDTO[];
  loading: boolean;
  error: string | null;

  // Paginação
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Sorting
  sortBy: PrintJobSortField | undefined;
  sortOrder: SortOrder;
  setSorting: (field: PrintJobSortField, order: SortOrder) => void;

  // Filtros
  filters: PrintJobFilters;
  setFilters: (filters: Partial<PrintJobFilters>) => void;
  applyFilters: () => Promise<void>;
  clearFilters: () => Promise<void>;

  // Detalhe
  selectedJob: PrintJobDetailDTO | null;
  fetchPrintJobDetail: (id: string) => Promise<PrintJobDetailDTO | null>;
  clearSelectedJob: () => void;

  // Ações
  reprocessJob: (id: string) => Promise<boolean>;
  exportJobs: (format: ExportFormat) => Promise<void>;

  // Estatísticas
  stats: PrintJobStats | null;
  fetchStats: () => Promise<void>;

  // Tabela de preços (mantido para compatibilidade)
  priceTable: PriceTableEntry[];
  paperTypes: PaperType[];
  createPriceEntry: (name: string, description: string, friendlyCode: string, paperTypeId: string, quality: string, colors: string, unitPrice: number) => Promise<void>;
  updatePriceEntry: (id: string, data: UpdatePriceTableEntryDTO) => Promise<void>;
  deletePriceEntry: (id: string) => Promise<void>;
  fetchPriceTable: () => Promise<void>;
  fetchPaperTypes: () => Promise<void>;
  getPriceForPaperTypeAndQuality: (paperTypeId: string, quality: string, colors: string) => PriceTableEntry | null;
}

export type PriceTableEntry = import('@grafica/shared/types').PriceTableEntry;

const DEFAULT_FILTERS: PrintJobFilters = {
  page: 1,
  pageSize: 25,
  sortBy: 'date',
  sortOrder: 'desc',
};

const DEBOUNCE_MS = 300;

export function usePrintHistory(): UsePrintHistoryReturn {
  const [printJobs, setPrintJobs] = useState<PrintJobDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginação
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState<PrintJobSortField | undefined>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filtros
  const [filters, setFiltersState] = useState<PrintJobFilters>(DEFAULT_FILTERS);

  // Detalhe
  const [selectedJob, setSelectedJob] = useState<PrintJobDetailDTO | null>(null);

  // Estatísticas
  const [stats, setStats] = useState<PrintJobStats | null>(null);

  // Tabela de preços (mantido para compatibilidade)
  const [priceTable, setPriceTable] = useState<PriceTableEntry[]>([]);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);

  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buscar lista de impressões
  const fetchPrintHistory = useCallback(async (overrideFilters?: Partial<PrintJobFilters>) => {
    try {
      setLoading(true);
      setError(null);

      const appliedFilters: PrintJobFilters = {
        ...filters,
        ...overrideFilters,
        page,
        pageSize,
        sortBy,
        sortOrder,
      };

      const result = await printJobService.listPrintJobs(appliedFilters);

      setPrintJobs(result.data);
      setTotalItems(result.total);
      setTotalPages(Math.ceil(result.total / pageSize));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar histórico';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, sortBy, sortOrder]);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await printJobService.getStats(filters);
      setStats(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(errorMessage);
    }
  }, [filters]);

  // Buscar detalhe de uma impressão
  const fetchPrintJobDetail = useCallback(async (id: string): Promise<PrintJobDetailDTO | null> => {
    try {
      setError(null);
      const result = await printJobService.getPrintJob(id);
      setSelectedJob(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar impressão';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Reprocessar impressão com erro
  const reprocessJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await printJobService.reprocessPrintJob(id);
      // Atualizar lista após reprocessar
      await fetchPrintHistory();
      await fetchStats();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reprocessar impressão';
      setError(errorMessage);
      return false;
    }
  }, [fetchPrintHistory, fetchStats]);

  // Exportar dados
  const exportJobs = useCallback(async (format: ExportFormat): Promise<void> => {
    try {
      setError(null);
      const blob = await printJobService.exportPrintJobs(format, filters);

      // Criar download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'impressoes.csv' : 'impressoes.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar dados';
      setError(errorMessage);
    }
  }, [filters]);

  // Paginação
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1); // Resetar para primeira página
  }, []);

  // Sorting
  const setSorting = useCallback((field: PrintJobSortField, order: SortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);

  // Filtros
  const setFilters = useCallback((newFilters: Partial<PrintJobFilters>) => {
    setFiltersState((prev: PrintJobFilters) => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = useCallback(async () => {
    setPageState(1);
    await fetchPrintHistory();
    await fetchStats();
  }, [fetchPrintHistory, fetchStats]);

  const clearFilters = useCallback(async () => {
    setFiltersState(DEFAULT_FILTERS);
    setPageState(1);
    setSortBy('date');
    setSortOrder('desc');
    await fetchPrintHistory();
    await fetchStats();
  }, [fetchPrintHistory, fetchStats]);

  const clearSelectedJob = useCallback(() => {
    setSelectedJob(null);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    fetchPrintHistory();
    fetchStats();
  }, [page, pageSize, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce para filtros de busca
  const debouncedFetch = useCallback((newFilters: PrintJobFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchPrintHistory(newFilters);
    }, DEBOUNCE_MS);
  }, [fetchPrintHistory]);

  // ─── Tabela de preços (mantido para compatibilidade) ───
  const fetchPriceTable = useCallback(async () => {
    try {
      setError(null);
      const entries = await priceTableService.getPrices();
      setPriceTable(entries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tabela de preços';
      setError(errorMessage);
    }
  }, []);

  const createPriceEntry = useCallback(async (name: string, description: string, friendlyCode: string, paperTypeId: string, quality: string, colors: string, unitPrice: number) => {
    try {
      setError(null);
      const data: CreatePriceTableEntryDTO = { name, description, friendlyCode, paperTypeId, quality, colors, unitPrice };
      const newEntry = await priceTableService.createPrice(data);
      setPriceTable((prev) => [...prev, newEntry]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar preço';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePriceEntry = useCallback(async (id: string, data: UpdatePriceTableEntryDTO) => {
    try {
      setError(null);
      const updated = await priceTableService.updatePrice(id, data);
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
      await priceTableService.deletePrice(id);
      setPriceTable((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar preço';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const fetchPaperTypes = useCallback(async () => {
    try {
      setError(null);
      const types = await paperTypeService.listPaperTypes({ activeOnly: true });
      setPaperTypes(types);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tipos de papel';
      setError(errorMessage);
    }
  }, []);

  const getPriceForPaperTypeAndQuality = useCallback((paperTypeId: string, quality: string, colors: string): PriceTableEntry | null => {
    return priceTable.find((entry) => entry.paperTypeId === paperTypeId && entry.quality === quality && entry.colors === colors) || null;
  }, [priceTable]);

  return {
    printJobs,
    loading,
    error,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    sortBy,
    sortOrder,
    setSorting,
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    selectedJob,
    fetchPrintJobDetail,
    clearSelectedJob,
    reprocessJob,
    exportJobs,
    stats,
    fetchStats,
    priceTable,
    createPriceEntry,
    updatePriceEntry,
    deletePriceEntry,
    fetchPriceTable,
    paperTypes,
    fetchPaperTypes,
    getPriceForPaperTypeAndQuality,
  };
}
