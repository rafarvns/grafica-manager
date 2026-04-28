import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetentionCleanupUseCase } from '@/application/use-cases/RetentionCleanupUseCase';
import { OrderAttachmentRepository } from '@/domain/repositories/OrderAttachmentRepository';
import { FileStorage } from '@/application/ports/FileStorage';
import { OrderAttachment } from '@/domain/entities/OrderAttachment';

describe('RetentionCleanupUseCase', () => {
  let sut: RetentionCleanupUseCase;
  let repository: OrderAttachmentRepository;
  let fileStorage: FileStorage;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      softDelete: vi.fn(),
      deletePhysical: vi.fn().mockResolvedValue(undefined),
      findExpiredForRetention: vi.fn().mockResolvedValue([
        new OrderAttachment({
          id: '1',
          orderId: 'order-1',
          filename: 'file1.pdf',
          originalFilename: 'original1.pdf',
          filepath: 'path/1',
          size: 100,
          mimeType: 'application/pdf',
        })
      ]),
    };

    fileStorage = {
      upload: vi.fn(),
      download: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    sut = new RetentionCleanupUseCase(repository, fileStorage);
  });

  it('deve deletar fisicamente arquivos expirados', async () => {
    const result = await sut.execute();

    expect(result.deletedCount).toBe(1);
    expect(fileStorage.delete).toHaveBeenCalledWith('path/1');
    expect(repository.deletePhysical).toHaveBeenCalledWith('1');
  });

  it('deve retornar contagem zero se não houver arquivos expirados', async () => {
    vi.mocked(repository.findExpiredForRetention).mockResolvedValueOnce([]);
    const result = await sut.execute();
    expect(result.deletedCount).toBe(0);
  });
});
