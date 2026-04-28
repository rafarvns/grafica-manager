export type RawReportRow = {
  label: string;
  printCount: number;
  revenue: number;
  cost: number;
};

export type ReportRow = RawReportRow & {
  grossMarginPercent: number;
  netMarginPercent: number;
};

export type ReportResult = {
  rows: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
