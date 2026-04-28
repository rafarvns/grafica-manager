import { Order } from '@/domain/entities/Order';
import { OrderStatus } from '@grafica/shared';

export interface OrderFilters {
  customerId?: string | undefined;
  status?: OrderStatus | undefined;
  orderNumber?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  skip?: number | undefined;
  take?: number | undefined;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findWithFilters(filters: OrderFilters): Promise<Order[]>;
  countWithFilters(filters: OrderFilters): Promise<number>;
  create(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, historyEntry: { fromStatus: OrderStatus | null, toStatus: OrderStatus, reason?: string }): Promise<Order>;
  findStatusHistory(orderId: string): Promise<any[]>;
  cancel(id: string, reason: string, historyEntry: { fromStatus: OrderStatus, toStatus: OrderStatus, reason: string }): Promise<Order>;
  listPrintJobs(orderId: string): Promise<any[]>;
}
