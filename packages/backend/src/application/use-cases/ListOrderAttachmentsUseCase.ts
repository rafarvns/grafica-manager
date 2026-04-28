import { OrderAttachment } from '../../domain/entities/OrderAttachment';
import { OrderAttachmentRepository } from '../../domain/repositories/OrderAttachmentRepository';

export class ListOrderAttachmentsUseCase {
  constructor(private repository: OrderAttachmentRepository) {}

  async execute(orderId: string): Promise<OrderAttachment[]> {
    return this.repository.findByOrderId(orderId);
  }
}
