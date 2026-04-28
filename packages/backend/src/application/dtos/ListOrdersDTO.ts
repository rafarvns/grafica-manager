export type OrderStatus = 'draft' | 'scheduled' | 'in_production' | 'completed' | 'shipping' | 'cancelled';

export interface ListOrdersInput {
  page?: number;
  pageSize?: number;
  customerId?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  orderNumber?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId: string;
  description: string;
  quantity: number;
  status: OrderStatus;
  salePrice: number;
  productionCost: number;
  dueDate: Date;
  createdAt: Date;
}

export interface ListOrdersOutput {
  data: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}
