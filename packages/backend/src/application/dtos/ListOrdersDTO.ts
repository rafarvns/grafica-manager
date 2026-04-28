export type OrderStatus = 'draft' | 'scheduled' | 'in_production' | 'completed' | 'shipping' | 'cancelled';

export interface ListOrdersInput {
  page?: number | undefined;
  pageSize?: number | undefined;
  customerId?: string | undefined;
  status?: OrderStatus | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  orderNumber?: string | undefined;
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
