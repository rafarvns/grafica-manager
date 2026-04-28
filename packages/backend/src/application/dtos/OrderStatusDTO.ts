export type OrderStatus = 'draft' | 'scheduled' | 'in_production' | 'completed' | 'shipping' | 'cancelled';

export interface StatusHistoryEntry {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  timestamp: Date;
}

export interface GetOrderOutput {
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
  status: OrderStatus;
  notes: string | null;
  statusHistory: StatusHistoryEntry[];
  cancellationReason?: string;
  cancellationTime?: Date;
  createdAt: Date;
}

export interface ChangeStatusOutput {
  id: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
}

export interface CancelOrderOutput {
  id: string;
  status: 'cancelled';
  cancellationReason: string;
  cancellationTime: Date;
  statusHistory: StatusHistoryEntry[];
}
