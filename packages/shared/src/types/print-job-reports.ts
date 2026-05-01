export type PrintJobReportGrouping =
  | 'none'
  | 'paper'
  | 'color'
  | 'quality'
  | 'printer'
  | 'status';

export interface PrintJobReportRow {
  id: string;
  printedAt: string;
  documentName: string;
  paperTypeName: string;
  paperWeight: number;
  colorProfile: 'CMYK' | 'RGB' | 'GRAYSCALE';
  quality: 'DRAFT' | 'NORMAL' | 'HIGH';
  pagesBlackAndWhite: number;
  pagesColor: number;
  totalPages: number;
  registeredCost: number;
  status: 'success' | 'error' | 'cancelled';
  printerName: string;
  presetName?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
}

export interface PrintJobReportGroupedRow {
  groupKey: string;
  groupLabel: string;
  jobCount: number;
  totalPages: number;
  totalPagesBlackAndWhite: number;
  totalPagesColor: number;
  totalCost: number;
  averageCostPerJob: number;
  averageCostPerPage: number;
  successRate: number;
  sharePercent: number;
}

export interface PrintJobReportTotals {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  successRate: number;
  totalPages: number;
  totalPagesBlackAndWhite: number;
  totalPagesColor: number;
  totalCost: number;
  averageCostPerJob: number;
  averageCostPerPage: number;
}

export interface PrintJobReportResult {
  rows: PrintJobReportRow[];
  grouped: PrintJobReportGroupedRow[];
  totals: PrintJobReportTotals;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
}
