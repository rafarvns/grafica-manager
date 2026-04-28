export interface CreatePriceTableInput {
  paperTypeId: string;
  quality: 'rascunho' | 'normal' | 'alta';
  unitPrice: number;
}

export interface UpdatePriceTableInput {
  id: string;
  unitPrice?: number;
}

export interface PriceTableOutput {
  id: string;
  paperTypeId: string;
  quality: 'rascunho' | 'normal' | 'alta';
  unitPrice: number;
  createdAt: Date;
}

export interface DeletePriceTableOutput {
  success: boolean;
  message: string;
  warning?: string;
}
