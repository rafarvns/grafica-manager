import { OrderAttachmentRepository } from '../../domain/repositories/OrderAttachmentRepository';

export class DeleteOrderAttachmentUseCase {
  constructor(private repository: OrderAttachmentRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
