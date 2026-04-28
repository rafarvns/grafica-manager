import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarkNotificationAsReadUseCase } from './MarkNotificationAsReadUseCase';
import { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import { Notification } from '@/domain/entities/Notification';

describe('MarkNotificationAsReadUseCase', () => {
  let repository: NotificationRepository;
  let useCase: MarkNotificationAsReadUseCase;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      deleteOlderThan: vi.fn(),
    };
    useCase = new MarkNotificationAsReadUseCase(repository);
  });

  it('should mark a notification as read', async () => {
    const notification = Notification.create({ title: 'N1', description: 'D1', type: 'generic', category: 'info' });
    (repository.findById as any).mockResolvedValue(notification);

    await useCase.execute({ id: notification.id });

    expect(repository.save).toHaveBeenCalled();
    const savedNotification = (repository.save as any).mock.calls[0][0];
    expect(savedNotification.read).toBe(true);
  });

  it('should throw error if notification not found', async () => {
    (repository.findById as any).mockResolvedValue(null);

    await expect(useCase.execute({ id: 'invalid' })).rejects.toThrow('Notification not found');
  });
});
