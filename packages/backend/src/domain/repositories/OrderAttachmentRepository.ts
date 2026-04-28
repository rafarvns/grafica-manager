import { OrderAttachment } from '../entities/OrderAttachment';

export interface OrderAttachmentRepository {
  save(attachment: OrderAttachment): Promise<void>;
  findById(id: string): Promise<OrderAttachment | null>;
  findByOrderId(orderId: string): Promise<OrderAttachment[]>;
  softDelete(id: string): Promise<void>;
  deletePhysical(id: string): Promise<void>;
  findExpiredForRetention(cutoffDate: Date): Promise<OrderAttachment[]>;
}
