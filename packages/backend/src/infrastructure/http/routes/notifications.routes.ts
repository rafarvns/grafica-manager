import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaNotificationRepository } from '../../database/repositories/PrismaNotificationRepository';
import { GetNotificationsUseCase } from '@/application/use-cases/notifications/GetNotificationsUseCase';
import { MarkNotificationAsReadUseCase } from '@/application/use-cases/notifications/MarkNotificationAsReadUseCase';
import { DismissNotificationUseCase } from '@/application/use-cases/notifications/DismissNotificationUseCase';
import { NotificationController } from '../controllers/NotificationController';

export function createNotificationsRouter(prisma: PrismaClient): Router {
  const router = Router();
  const repository = new PrismaNotificationRepository(prisma);

  const getUseCase = new GetNotificationsUseCase(repository);
  const markReadUseCase = new MarkNotificationAsReadUseCase(repository);
  const dismissUseCase = new DismissNotificationUseCase(repository);

  const controller = new NotificationController(getUseCase, markReadUseCase, dismissUseCase);

  router.get('/', (req, res) => controller.list(req, res));
  router.patch('/:id/read', (req, res) => controller.markRead(req, res));
  router.patch('/:id/dismiss', (req, res) => controller.dismissNotification(req, res));

  return router;
}
