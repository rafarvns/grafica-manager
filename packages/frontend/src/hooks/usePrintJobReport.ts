import { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import type { PrintJobReportResult, PrintJobReportGrouping } from '@grafica/shared';

export type { PrintJobReportGrouping };
export type PrintJobReportPageSize = 25 | 50 | 100;

export interface PrintJobReportFilters {
  startDate: string;
  endDate: string;
  grouping?: PrintJobReportGrouping;
  page?: number;
  pageSize?: PrintJobReportPageSize;
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

export function usePrintJobReport() {
  const [data, setData] = useState<PrintJobReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Partial<PrintJobReportFilters>>({});

  const generate = useCallback(async (f: PrintJobReportFilters) => {
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

      const resp = await apiClient.get<{ data: PrintJobReportResult }>(
        '/reports/print-jobs',
        { params }
      );
      setData(resp.data.data);
      setFiltersState(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCsv = useCallback(async (f: PrintJobReportFilters) => {
    try {
      const blob = await apiClient.postBlob('/reports/print-jobs/export', {
        filters: f,
        format: 'csv',
      });
      triggerDownload(blob, 'impressoes.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar CSV');
    }
  }, []);

  const exportExcel = useCallback(async (f: PrintJobReportFilters) => {
    try {
      const blob = await apiClient.postBlob('/reports/print-jobs/export', {
        filters: f,
        format: 'excel',
      });
      triggerDownload(blob, 'impressoes.xlsx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar Excel');
    }
  }, []);

  const changePage = useCallback(
    (page: number) => {
      if (!filters.startDate || !filters.endDate) return;
      void generate({ ...(filters as PrintJobReportFilters), page });
    },
    [filters, generate]
  );

  return { data, loading, error, filters, generate, exportCsv, exportExcel, changePage };
}
