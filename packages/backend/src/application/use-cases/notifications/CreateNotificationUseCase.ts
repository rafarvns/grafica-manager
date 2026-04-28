import { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import { Notification, NotificationType, NotificationCategory } from '@/domain/entities/Notification';

interface CreateNotificationInput {
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  orderId?: string;
  webhookId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export class CreateNotificationUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    const notification = Notification.create(input);
    await this.repository.save(notification);
    return notification;
  }
}
