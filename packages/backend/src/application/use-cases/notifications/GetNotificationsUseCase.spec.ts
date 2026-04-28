import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetNotificationsUseCase } from './GetNotificationsUseCase';
import { NotificationRepository } from '@/domain/repositories/NotificationRepository';
import { Notification } from '@/domain/entities/Notification';

describe('GetNotificationsUseCase', () => {
  let repository: NotificationRepository;
  let useCase: GetNotificationsUseCase;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      deleteOlderThan: vi.fn(),
    };
    useCase = new GetNotificationsUseCase(repository);
  });

  it('should list non-dismissed notifications by default', async () => {
    const mockNotifications = [
      Notification.create({ title: 'N1', description: 'D1', type: 'generic', category: 'info' }),
      Notification.create({ title: 'N2', description: 'D2', type: 'generic', category: 'info' }),
    ];
    (repository.findAll as any).mockResolvedValue(mockNotifications);

    const result = await useCase.execute({});

    expect(repository.findAll).toHaveBeenCalledWith({ dismissed: false });
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('N1');
  });

  it('should allow filtering by read status', async () => {
    await useCase.execute({ read: true });
    expect(repository.findAll).toHaveBeenCalledWith({ dismissed: false, read: true });
  });
});
