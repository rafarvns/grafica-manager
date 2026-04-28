export interface CreateOrderInput {
  customerId: string;
  description: string;
  quantity: number;
  paperTypeId: string;
  width: number;
  height: number;
  dueDate: Date;
  salePrice: number;
  productionCost: number;
  notes?: string;
}

export interface CreateOrderOutput {
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
  status: 'draft';
  notes: string | null;
  createdAt: Date;
}
