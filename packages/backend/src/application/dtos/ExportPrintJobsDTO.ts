export type ExportFormat = 'csv' | 'pdf';

export interface ExportPrintJobsInput {
  format: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  customerId?: string;
  orderId?: string;
  documentName?: string;
  origin?: string;
}

export interface ExportPrintJobsOutput {
  buffer: Buffer;
  contentType: string;
  filename: string;
}