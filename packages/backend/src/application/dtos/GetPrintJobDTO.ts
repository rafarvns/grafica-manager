export interface GetPrintJobInput {
  id: string;
}

export interface PrintJobCostBreakdown {
  paperCost: number;
  marginCost: number;
  discount: number;
  total: number;
}

export interface GetPrintJobOutput {
  id: string;
  documentName: string;
  paperTypeId: string;
  paperTypeName?: string;
  quality: string;
  colorMode: string;
  dpi: number;
  pageCount: number;
  status: string;
  registeredCost: number;
  errorMessage?: string;
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  origin?: string;
  printerId?: string;
  printerName?: string;
  pagesBlackAndWhite: number;
  pagesColor: number;
  costBreakdown?: PrintJobCostBreakdown;
  createdAt: Date;
}