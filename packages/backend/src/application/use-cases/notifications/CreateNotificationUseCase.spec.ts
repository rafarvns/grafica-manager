import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateNotificationUseCase } from './CreateNotificationUseCase';
import { NotificationRepository } from '@/domain/repositories/NotificationRepository';

describe('CreateNotificationUseCase', () => {
  let repository: NotificationRepository;
  let useCase: CreateNotificationUseCase;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      deleteOlderThan: vi.fn(),
    };
    useCase = new CreateNotificationUseCase(repository);
  });

  it('should create a notification', async () => {
    const input = {
      title: 'New order',
      description: 'Order ORD-123 is ready',
      type: 'generic' as const,
      category: 'info' as const,
      actionUrl: '/orders/ORD-123'
    };

    await useCase.execute(input);

    expect(repository.save).toHaveBeenCalled();
    const savedNotification = (repository.save as any).mock.calls[0][0];
    expect(savedNotification.title).toBe(input.title);
    expect(savedNotification.actionUrl).toBe(input.actionUrl);
  });
});
