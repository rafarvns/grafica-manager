import { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';

export type ReportGrouping = 'NONE' | 'CLIENT' | 'PAPER' | 'ORIGIN' | 'PERIOD';
export type SortDirection = 'ASC' | 'DESC';
export type PageSize = 25 | 50 | 100;

export interface ReportFilters {
  from: string;
  to: string;
  customerId?: string;
  origin?: string;
  paperTypeId?: string;
  grouping?: ReportGrouping;
  sortColumn?: string;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: PageSize;
}

export interface ReportRow {
  label: string;
  printCount: number;
  revenue: number;
  cost: number;
  grossMarginPercent: number;
  netMarginPercent: number;
}

export interface ReportResult {
  rows: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_BASE = 'http://localhost:3000/api/v1';

function buildExportUrl(path: string, filters: ReportFilters): string {
  const qs = new URLSearchParams();
  qs.set('from', filters.from);
  qs.set('to', filters.to);
  if (filters.customerId) qs.set('customerId', filters.customerId);
  if (filters.origin) qs.set('origin', filters.origin);
  if (filters.paperTypeId) qs.set('paperTypeId', filters.paperTypeId);
  if (filters.grouping) qs.set('grouping', filters.grouping);
  if (filters.sortColumn) qs.set('sortColumn', filters.sortColumn);
  if (filters.sortDirection) qs.set('sortDirection', filters.sortDirection);
  if (filters.page) qs.set('page', String(filters.page));
  if (filters.pageSize) qs.set('pageSize', String(filters.pageSize));
  return `${API_BASE}/reports${path}?${qs}`;
}

export function useReports() {
  const [data, setData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<ReportFilters>>({});

  const generate = useCallback(async (f: ReportFilters) => {
    if (!f.from || !f.to) {
      setError('Selecione um período para gerar o relatório');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post<{ data: ReportResult }>('/v1/reports/generate', f);
      setData(resp.data.data);
      setFilters(f);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar relatório';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCsv = useCallback(
    (f: ReportFilters) => {
      const url = buildExportUrl('/export/csv', f);
      window.open(url, '_blank');
    },
    []
  );

  const exportExcel = useCallback(
    (f: ReportFilters) => {
      const url = buildExportUrl('/export/excel', f);
      window.open(url, '_blank');
    },
    []
  );

  const exportPdf = useCallback(() => {
    window.print();
  }, []);

  const changePage = useCallback(
    (page: number) => {
      if (!filters.from || !filters.to) return;
      void generate({ ...(filters as ReportFilters), page });
    },
    [filters, generate]
  );

  return { data, loading, error, filters, generate, exportCsv, exportExcel, exportPdf, changePage };
}
