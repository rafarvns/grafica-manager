import { Request, Response } from 'express';
import { GetNotificationsUseCase } from '@/application/use-cases/notifications/GetNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '@/application/use-cases/notifications/MarkNotificationAsReadUseCase';
import { DismissNotificationUseCase } from '@/application/use-cases/notifications/DismissNotificationUseCase';

export class NotificationController {
  constructor(
    private readonly getNotifications: GetNotificationsUseCase,
    private readonly markAsRead: MarkNotificationAsReadUseCase,
    private readonly dismiss: DismissNotificationUseCase
  ) {}

  async list(req: Request, res: Response) {
    try {
      const { read, dismissed } = req.query;
      const input: any = {};
      if (read === 'true') input.read = true;
      if (read === 'false') input.read = false;
      if (dismissed === 'true') input.dismissed = true;
      if (dismissed === 'false') input.dismissed = false;

      const notifications = await this.getNotifications.execute(input);
      res.json(notifications.map(n => n.toJSON()));
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const id = req.params.id;
      if (!id) throw new Error('Notification ID is required');
      await this.markAsRead.execute({ id });
      res.status(204).send();
    } catch (error) {
      const status = error instanceof Error && error.message === 'Notification not found' ? 404 : 500;
      res.status(status).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  }

  async dismissNotification(req: Request, res: Response) {
    try {
      const id = req.params.id;
      if (!id) throw new Error('Notification ID is required');
      await this.dismiss.execute({ id });
      res.status(204).send();
    } catch (error) {
      const status = error instanceof Error && error.message === 'Notification not found' ? 404 : 500;
      res.status(status).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  }
}
