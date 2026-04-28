import { NotificationRepository, NotificationFilter } from '@/domain/repositories/NotificationRepository';
import { Notification } from '@/domain/entities/Notification';

interface GetNotificationsInput {
  read?: boolean;
  dismissed?: boolean;
}

export class GetNotificationsUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(input: GetNotificationsInput): Promise<Notification[]> {
    const filter: NotificationFilter = {};
    if (input.read !== undefined) filter.read = input.read;
    filter.dismissed = input.dismissed ?? false;
    
    return this.repository.findAll(filter);
  }
}
