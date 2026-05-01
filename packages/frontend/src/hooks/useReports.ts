import { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import type { ReportResult } from '@grafica/shared';

export type ReportGrouping = 'none' | 'customer' | 'order' | 'paper' | 'origin';
export type SortDirection = 'ASC' | 'DESC';
export type PageSize = 25 | 50 | 100;

export interface ReportFilters {
  startDate: string;
  endDate: string;
  grouping?: ReportGrouping;
  page?: number;
  pageSize?: PageSize;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useReports() {
  const [data, setData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Partial<ReportFilters>>({});

  const generate = useCallback(async (f: ReportFilters) => {
    if (!f.startDate || !f.endDate) {
      setError('Selecione um período para gerar o relatório');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        startDate: f.startDate,
        endDate: f.endDate,
      };
      if (f.grouping) params['grouping'] = f.grouping;
      if (f.page) params['page'] = f.page;
      if (f.pageSize) params['pageSize'] = f.pageSize;

      const resp = await apiClient.get<{ data: ReportResult }>('/reports/generate', { params });
      setData(resp.data.data);
      setFiltersState(f);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar relatório';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCsv = useCallback(async (f: ReportFilters) => {
    try {
      const blob = await apiClient.postBlob('/reports/export', { filters: f, format: 'csv' });
      triggerDownload(blob, 'relatorio.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar CSV');
    }
  }, []);

  const exportExcel = useCallback(async (f: ReportFilters) => {
    try {
      const blob = await apiClient.postBlob('/reports/export', { filters: f, format: 'excel' });
      triggerDownload(blob, 'relatorio.xlsx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar Excel');
    }
  }, []);

  const exportPdf = useCallback(async (f: ReportFilters) => {
    try {
      const blob = await apiClient.postBlob('/reports/export', { filters: f, format: 'pdf' });
      triggerDownload(blob, 'relatorio.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar PDF');
    }
  }, []);

  const changePage = useCallback(
    (page: number) => {
      if (!filters.startDate || !filters.endDate) return;
      void generate({ ...(filters as ReportFilters), page });
    },
    [filters, generate]
  );

  return { data, loading, error, filters, generate, exportCsv, exportExcel, exportPdf, changePage };
}
