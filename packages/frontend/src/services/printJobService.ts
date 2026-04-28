import { apiClient } from '@/services/apiClient';
import type {
  PrintJobDTO,
  PrintJobDetailDTO,
  PrintJobFilters,
  PaginatedPrintJobs,
  PrintJobStats,
  ReprocessPrintJobOutput,
  ExportFormat,
} from '@grafica/shared/types';

const BASE_PATH = '/print-jobs';

export const printJobService = {
  async listPrintJobs(filters: PrintJobFilters): Promise<PaginatedPrintJobs> {
    const params: Record<string, string> = {};

    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.status) params.status = filters.status;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.orderId) params.orderId = filters.orderId;
    if (filters.documentName) params.documentName = filters.documentName;
    if (filters.origin && filters.origin !== 'ALL') params.origin = filters.origin;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    if (filters.page) params.page = String(filters.page);
    if (filters.pageSize) params.pageSize = String(filters.pageSize);

    const response = await apiClient.get<PaginatedPrintJobs>(BASE_PATH, { params });
    return response.data;
  },

  async getPrintJob(id: string): Promise<PrintJobDetailDTO> {
    const response = await apiClient.get<PrintJobDetailDTO>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  async reprocessPrintJob(id: string): Promise<ReprocessPrintJobOutput> {
    const response = await apiClient.post<ReprocessPrintJobOutput>(`${BASE_PATH}/${id}/reprocess`, {});
    return response.data;
  },

  async getStats(filters?: Partial<PrintJobFilters>): Promise<PrintJobStats> {
    const params: Record<string, string> = {};

    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.status) params.status = filters.status;
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.origin && filters.origin !== 'ALL') params.origin = filters.origin;

    const response = await apiClient.get<PrintJobStats>(`${BASE_PATH}/stats`, { params });
    return response.data;
  },

  async exportPrintJobs(format: ExportFormat, filters?: Partial<PrintJobFilters>): Promise<Blob> {
    const params: Record<string, string> = { format };

    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.status) params.status = filters.status;
    if (filters?.customerId) params.customerId = filters.customerId;
    if (filters?.orderId) params.orderId = filters.orderId;
    if (filters?.origin && filters.origin !== 'ALL') params.origin = filters.origin;

    const response = await fetch(
      `${apiClient.getBaseUrl()}${BASE_PATH}/export?${new URLSearchParams(params)}`,
      {
        headers: {
          Authorization: `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao exportar: ${response.status}`);
    }

    return response.blob();
  },
};