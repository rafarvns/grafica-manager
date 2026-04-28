import { NotificationRepository } from '@/domain/repositories/NotificationRepository';

interface MarkNotificationAsReadInput {
  id: string;
}

export class MarkNotificationAsReadUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(input: MarkNotificationAsReadInput): Promise<void> {
    const notification = await this.repository.findById(input.id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.markAsRead();
    await this.repository.save(notification);
  }
}
