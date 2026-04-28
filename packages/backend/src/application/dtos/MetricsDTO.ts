export interface TopCustomerEntry {
  customerId: string;
  name: string;
  revenue: number;
  orderCount: number;
}

export interface CostAnalysisOutput {
  revenue: number;
  cost: number;
  grossMargin: number;
  grossMarginPercent: number;
}

export interface PrintTrendEntry {
  date: string;
  count: number;
}

export interface DashboardQueryParams {
  from?: string;
  to?: string;
  preset?: string;
}
