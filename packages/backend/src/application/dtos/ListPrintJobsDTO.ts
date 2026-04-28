export interface ListPrintJobsInput {
  startDate?: Date;
  endDate?: Date;
  status?: 'sucesso' | 'erro' | 'cancelada';
  orderId?: string;
  documentName?: string;
}

export interface ListPrintJobsOutput {
  id: string;
  documentName: string;
  paperTypeId: string;
  quality: string;
  colorMode: string;
  dpi: number;
  pageCount: number;
  status: 'sucesso' | 'erro' | 'cancelada';
  registeredCost: number;
  errorMessage?: string;
  orderId?: string;
  createdAt: Date;
}
