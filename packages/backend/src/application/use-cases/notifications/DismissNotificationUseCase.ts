import { NotificationRepository } from '@/domain/repositories/NotificationRepository';

interface DismissNotificationInput {
  id: string;
}

export class DismissNotificationUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(input: DismissNotificationInput): Promise<void> {
    const notification = await this.repository.findById(input.id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.dismiss();
    await this.repository.save(notification);
  }
}
