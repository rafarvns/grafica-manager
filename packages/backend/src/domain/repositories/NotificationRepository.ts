import { Notification } from '../entities/Notification';

export interface NotificationFilter {
  read?: boolean;
  dismissed?: boolean;
}

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findAll(filter?: NotificationFilter): Promise<Notification[]>;
  deleteOlderThan(days: number): Promise<number>;
}
