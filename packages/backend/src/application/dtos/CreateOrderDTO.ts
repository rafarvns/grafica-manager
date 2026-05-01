export interface CreateOrderInput {
  customerId: string;
  description: string;
  quantity: number;
  priceTableEntryId?: string;
  dueDate: Date;
  salePrice: number;
  notes?: string;
}

export interface CreateOrderOutput {
  id: string;
  orderNumber: string;
  customerId: string;
  description: string;
  quantity: number;
  priceTableEntryId?: string | null;
  dueDate: Date | null;
  salePrice: number;
  status: 'draft';
  notes: string | null;
  createdAt: Date;
}
