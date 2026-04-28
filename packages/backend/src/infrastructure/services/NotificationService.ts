import { CreateNotificationUseCase } from '@/application/use-cases/notifications/CreateNotificationUseCase';
import { PrismaNotificationRepository } from '../database/repositories/PrismaNotificationRepository';
import { PrismaClient } from '@prisma/client';

export class NotificationService {
  private createNotification: CreateNotificationUseCase;

  constructor(prisma: PrismaClient) {
    const repository = new PrismaNotificationRepository(prisma);
    this.createNotification = new CreateNotificationUseCase(repository);
  }

  async send(params: {
    title: string;
    description: string;
    type?: string;
    category?: 'critical' | 'warning' | 'info';
    orderId?: string;
    actionUrl?: string;
    actionLabel?: string;
  }) {
    return this.createNotification.execute(params as any);
  }

  async sendInfo(title: string, description: string, extras?: any) {
    return this.send({ title, description, category: 'info', ...extras });
  }

  async sendWarning(title: string, description: string, extras?: any) {
    return this.send({ title, description, category: 'warning', ...extras });
  }

  async sendCritical(title: string, description: string, extras?: any) {
    return this.send({ title, description, category: 'critical', ...extras });
  }
}
