// Tipos de domínio compartilhados entre frontend e backend

export type ID = string;

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export * from './orders';
export * from './settings';

// Re-exportar seletivamente de print-jobs para evitar conflitos com tipos base
export type {
  PrintJobStatus,
  PrintJobSortField,
  SortOrder,
  PrintJobOrigin,
  ExportFormat,
  PrintJobDTO,
  PrintJobDetailDTO,
  PrintJobCostBreakdown,
  PrintJobFilters,
  PaginatedPrintJobs,
  ReprocessPrintJobInput,
  ReprocessPrintJobOutput,
  ExportPrintJobsInput,
  PrintJobStats,
} from './print-jobs';
