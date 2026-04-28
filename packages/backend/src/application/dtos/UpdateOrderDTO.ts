export interface UpdateOrderInput {
  description?: string;
  quantity?: number;
  paperTypeId?: string;
  width?: number;
  height?: number;
  dueDate?: Date;
  salePrice?: number;
  productionCost?: number;
  notes?: string | null;
}

export interface UpdateOrderOutput {
  id: string;
  orderNumber: string;
  customerId: string;
  description: string;
  quantity: number;
  paperTypeId: string;
  width: number;
  height: number;
  dueDate: Date;
  salePrice: number;
  productionCost: number;
  status: string;
  notes: string | null;
  createdAt: Date;
}
