export interface UpdateOrderInput {
  description?: string;
  quantity?: number;
  priceTableEntryId?: string | null;
  dueDate?: Date;
  salePrice?: number;
  notes?: string | null;
  position?: number;
}

export interface UpdateOrderOutput {
  id: string;
  orderNumber: string;
  customerId: string;
  description: string;
  quantity: number;
  priceTableEntryId?: string | null;
  dueDate: Date | null;
  salePrice: number;
  status: string;
  notes: string | null;
  position: number;
  createdAt: Date;
}
