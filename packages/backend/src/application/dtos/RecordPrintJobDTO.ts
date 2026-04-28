export interface RecordPrintJobInput {
  documentName: string;
  paperTypeId: string;
  quality: 'rascunho' | 'normal' | 'alta';
  colorMode: 'CMYK' | 'RGB' | 'GRAYSCALE';
  dpi: 150 | 300 | 600;
  pageCount: number;
  status: 'sucesso' | 'erro' | 'cancelada';
  errorMessage?: string;
  orderId?: string;
}

export interface RecordPrintJobOutput {
  id: string;
  documentName: string;
  paperTypeId: string;
  quality: 'rascunho' | 'normal' | 'alta';
  colorMode: 'CMYK' | 'RGB' | 'GRAYSCALE';
  dpi: 150 | 300 | 600;
  pageCount: number;
  status: 'sucesso' | 'erro' | 'cancelada';
  registeredCost: number;
  errorMessage?: string;
  orderId?: string;
  createdAt: Date;
}
