import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DismissNotificationUseCase } from './DismissNotificationUseCase';
import { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import { Notification } from '@/domain/entities/Notification';

describe('DismissNotificationUseCase', () => {
  let repository: NotificationRepository;
  let useCase: DismissNotificationUseCase;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      deleteOlderThan: vi.fn(),
    };
    useCase = new DismissNotificationUseCase(repository);
  });

  it('should dismiss a notification', async () => {
    const notification = Notification.create({ title: 'N1', description: 'D1', type: 'generic', category: 'info' });
    (repository.findById as any).mockResolvedValue(notification);

    await useCase.execute({ id: notification.id });

    expect(repository.save).toHaveBeenCalled();
    const savedNotification = (repository.save as any).mock.calls[0][0];
    expect(savedNotification.dismissedAt).toBeInstanceOf(Date);
  });
});
