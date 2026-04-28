// eslint-disable-next-line -- import circular aceitável: index.ts re-exporta este arquivo, mas só usamos tipos base
import type { ID, PaginatedResult, PaginationParams } from './index';

// ─── Enums ──────────────────────────────────────────────────────────────────

export type PrintJobStatus = 'sucesso' | 'erro' | 'pendente';

export type PrintJobSortField = 'date' | 'cost' | 'status' | 'customer';

export type SortOrder = 'asc' | 'desc';

export type PrintJobOrigin = 'SHOPEE' | 'MANUAL';

export type ExportFormat = 'csv' | 'pdf';

// ─── DTOs ───────────────────────────────────────────────────────────────────

export interface PrintJobDTO {
  id: ID;
  documentName: string;
  paperTypeId: string;
  paperTypeName?: string;
  quality: string;
  colorMode: string;
  dpi: number;
  pageCount: number;
  status: PrintJobStatus;
  registeredCost: number;
  errorMessage?: string;
  orderId?: ID;
  orderNumber?: string;
  customerId?: ID;
  customerName?: string;
  origin?: PrintJobOrigin;
  createdAt: string;
}

export interface PrintJobDetailDTO extends PrintJobDTO {
  printerId?: ID;
  printerName?: string;
  presetId?: ID;
  presetName?: string;
  paperWeight?: number;
  pagesBlackAndWhite: number;
  pagesColor: number;
  costBreakdown?: PrintJobCostBreakdown;
}

export interface PrintJobCostBreakdown {
  paperCost: number;
  marginCost: number;
  discount: number;
  total: number;
}

// ─── Filters ────────────────────────────────────────────────────────────────

export interface PrintJobFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  status?: PrintJobStatus;
  customerId?: ID;
  orderId?: ID;
  documentName?: string;
  origin?: PrintJobOrigin | 'ALL';
  sortBy?: PrintJobSortField;
  sortOrder?: SortOrder;
}

// ─── Paginated Result ───────────────────────────────────────────────────────

export type PaginatedPrintJobs = PaginatedResult<PrintJobDTO>;

// ─── Reprocess ──────────────────────────────────────────────────────────────

export interface ReprocessPrintJobInput {
  id: ID;
}

export interface ReprocessPrintJobOutput {
  id: ID;
  status: PrintJobStatus;
  message: string;
}

// ─── Export ─────────────────────────────────────────────────────────────────

export interface ExportPrintJobsInput extends Omit<PrintJobFilters, 'page' | 'pageSize'> {
  format: ExportFormat;
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface PrintJobStats {
  totalJobs: number;
  totalCost: number;
  successRate: number;
}