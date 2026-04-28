import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloadOrderAttachmentUseCase } from '@/application/use-cases/DownloadOrderAttachmentUseCase';
import { OrderAttachmentRepository } from '@/domain/repositories/OrderAttachmentRepository';
import { OrderAttachment } from '@/domain/entities/OrderAttachment';
import { FileNotFoundError } from '@/domain/errors/file-storage-errors';
import { Readable } from 'stream';

describe('DownloadOrderAttachmentUseCase', () => {
  let sut: DownloadOrderAttachmentUseCase;
  let repository: OrderAttachmentRepository;
  let fileStorage: any;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(
        new OrderAttachment({
          id: '1',
          orderId: 'order-1',
          filename: 'file1.pdf',
          originalFilename: 'original1.pdf',
          filepath: 'path/1',
          size: 100,
          mimeType: 'application/pdf',
        })
      ),
      findByOrderId: vi.fn(),
      softDelete: vi.fn(),
      deletePhysical: vi.fn(),
      findExpiredForRetention: vi.fn(),
    };

    fileStorage = {
      download: vi.fn().mockResolvedValue(Readable.from(['test'])),
    };

    sut = new DownloadOrderAttachmentUseCase(repository, fileStorage);
  });

  it('deve retornar stream e metadados para download', async () => {
    const result = await sut.execute('1');

    expect(result.originalFilename).toBe('original1.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(fileStorage.download).toHaveBeenCalledWith('path/1');
  });

  it('deve lançar erro se arquivo não existir no repositório', async () => {
    vi.mocked(repository.findById).mockResolvedValueOnce(null);
    await expect(sut.execute('invalid')).rejects.toThrow(FileNotFoundError);
  });
});
