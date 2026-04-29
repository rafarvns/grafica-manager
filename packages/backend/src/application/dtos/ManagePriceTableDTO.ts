export interface CreatePriceTableInput {
  name?: string;
  description?: string;
  friendlyCode?: string;
  paperTypeId: string;
  quality: string;
  colors: string;
  unitPrice: number;
  validUntil?: Date;
}

export interface UpdatePriceTableInput {
  id: string;
  name?: string;
  description?: string;
  unitPrice?: number;
  validUntil?: Date;
}

export interface PriceTableOutput {
  id: string;
  name?: string | null | undefined;
  description?: string | null | undefined;
  friendlyCode: string;
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
