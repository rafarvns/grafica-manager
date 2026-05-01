export type OrderStatus = 'draft' | 'scheduled' | 'in_production' | 'completed' | 'shipping' | 'cancelled';

export interface StatusHistoryEntry {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  timestamp: Date;
}

export interface GetOrderOutput {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string | null;
  description: string;
  quantity: number;
  priceTableEntryId?: string | null;
  dueDate?: Date | null;
  salePrice: number;
  status: OrderStatus;
  notes?: string | null;
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
