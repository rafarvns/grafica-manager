import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteOrderAttachmentUseCase } from '@/application/use-cases/DeleteOrderAttachmentUseCase';
import { OrderAttachmentRepository } from '@/domain/repositories/OrderAttachmentRepository';

describe('DeleteOrderAttachmentUseCase', () => {
  let sut: DeleteOrderAttachmentUseCase;
  let repository: OrderAttachmentRepository;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      softDelete: vi.fn().mockResolvedValue(undefined),
      deletePhysical: vi.fn(),
      findExpiredForRetention: vi.fn(),
    };

    sut = new DeleteOrderAttachmentUseCase(repository);
  });

  it('deve marcar um anexo como deletado (soft-delete)', async () => {
    await sut.execute('1');
    expect(repository.softDelete).toHaveBeenCalledWith('1');
  });
});
