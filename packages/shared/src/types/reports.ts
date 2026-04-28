import { OrderStatus } from './orders';

export interface ReportRow {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  paperType: string;
  quantity: number;
  salePrice: number;
  cost: number;
  margin: number;
  marginPercent: number;
  date: string;
  origin: 'SHOPEE' | 'MANUAL';
}

export interface ReportTotals {
  totalOrders: number;
  totalQuantity: number;
  totalCost: number;
  totalRevenue: number;
  totalMargin: number;
  marginPercent: number;
  ticketAverage: number;
}

export interface ReportPagination {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ReportResult {
  rows: ReportRow[];
  totals: ReportTotals;
  pagination: ReportPagination;
}

export interface ReportFilters {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  customerIds?: string[];
  paperTypeIds?: string[];
  origin?: ('SHOPEE' | 'MANUAL')[];
  statuses?: OrderStatus[];
}

export interface ReportGroupedRow {
  groupLabel: string;
  subtotal: {
    quantity: number;
    salePrice: number;
    cost: number;
    margin: number;
  };
  rows: ReportRow[];
}
