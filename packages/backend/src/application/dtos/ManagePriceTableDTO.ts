export interface CreatePriceTableInput {
  paperTypeId: string;
  quality: string;
  colors: string;
  unitPrice: number;
  validUntil?: Date;
}

export interface UpdatePriceTableInput {
  id: string;
  unitPrice?: number;
  validUntil?: Date;
}

export interface PriceTableOutput {
  id: string;
  paperTypeId: string;
  quality: string;
  colors: string;
  unitPrice: number;
  validUntil?: Date;
  createdAt: Date;
}

export interface DeletePriceTableOutput {
  success: boolean;
  message: string;
  warning?: string;
}
