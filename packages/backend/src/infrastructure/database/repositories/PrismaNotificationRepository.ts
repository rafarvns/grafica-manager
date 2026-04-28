import { PrismaClient } from '@prisma/client';
import { Notification, NotificationType, NotificationCategory } from '@/domain/entities/Notification';
import { NotificationRepository, NotificationFilter } from '@/domain/repositories/NotificationRepository';

export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<void> {
    const data = notification.toJSON();
    await this.prisma.notification.upsert({
      where: { id: data.id },
      update: {
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        read: data.read,
        dismissedAt: data.dismissedAt,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        orderId: data.orderId,
        webhookId: data.webhookId,
        updatedAt: data.updatedAt,
      },
      create: {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category,
        read: data.read,
        dismissedAt: data.dismissedAt,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        orderId: data.orderId,
        webhookId: data.webhookId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const data = await this.prisma.notification.findUnique({ where: { id } });
    if (!data) return null;
    return this.mapToDomain(data);
  }

  async findAll(filter?: NotificationFilter): Promise<Notification[]> {
    const where: any = {};
    if (filter?.read !== undefined) where.read = filter.read;
    if (filter?.dismissed !== undefined) {
      where.dismissedAt = filter.dismissed ? { not: null } : null;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(this.mapToDomain);
  }

  async deleteOlderThan(days: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: date } },
    });
    return result.count;
  }

  private mapToDomain(data: any): Notification {
    return new Notification({
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type as NotificationType,
      category: data.category as NotificationCategory,
      read: data.read,
      dismissedAt: data.dismissedAt,
      orderId: data.orderId,
      webhookId: data.webhookId,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
