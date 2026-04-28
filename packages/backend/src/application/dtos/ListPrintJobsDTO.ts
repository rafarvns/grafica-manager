export interface ListPrintJobsInput {
  startDate?: Date;
  endDate?: Date;
  status?: 'sucesso' | 'erro' | 'cancelada' | 'pendente';
  orderId?: string;
  documentName?: string;
  customerId?: string;
  origin?: 'SHOPEE' | 'MANUAL';
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'cost' | 'status' | 'customer';
  sortOrder?: 'asc' | 'desc';
}

export interface ListPrintJobsOutput {
  id: string;
  documentName: string;
  paperTypeId: string;
  paperTypeName?: string;
  quality: string;
  colorMode: string;
  dpi: number;
  pageCount: number;
  status: 'sucesso' | 'erro' | 'cancelada' | 'pendente';
  registeredCost: number;
  errorMessage?: string;
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  origin?: 'SHOPEE' | 'MANUAL';
  createdAt: Date;
}

export interface PaginatedPrintJobsResult {
  data: ListPrintJobsOutput[];
  total: number;
  page: number;
  pageSize: number;
}
