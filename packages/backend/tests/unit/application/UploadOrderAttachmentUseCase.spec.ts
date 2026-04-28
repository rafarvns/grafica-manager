import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadOrderAttachmentUseCase } from '@/application/use-cases/UploadOrderAttachmentUseCase';
import { OrderAttachmentRepository } from '@/domain/repositories/OrderAttachmentRepository';
import { FileTooLargeError, InvalidMimeTypeError } from '@/domain/errors/file-storage-errors';

describe('UploadOrderAttachmentUseCase', () => {
  let sut: UploadOrderAttachmentUseCase;
  let repository: OrderAttachmentRepository;
  let fileStorage: any;

  beforeEach(() => {
    repository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      softDelete: vi.fn(),
      deletePhysical: vi.fn(),
      findExpiredForRetention: vi.fn(),
    };

    fileStorage = {
      upload: vi.fn().mockResolvedValue('files/orders/1/uuid.pdf'),
    };

    sut = new UploadOrderAttachmentUseCase(repository, fileStorage);
  });

  it('deve fazer upload de um arquivo válido', async () => {
    const input = {
      orderId: '1',
      file: {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as any,
    };

    const result = await sut.execute(input);

    expect(result).toHaveProperty('id');
    expect(result.originalFilename).toBe('test.pdf');
    expect(fileStorage.upload).toHaveBeenCalledWith('1', input.file);
    expect(repository.save).toHaveBeenCalled();
  });

  it('deve rejeitar arquivos maiores que 10MB', async () => {
    const input = {
      orderId: '1',
      file: {
        buffer: Buffer.from('test'),
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024, // 11MB
      } as any,
    };

    await expect(sut.execute(input)).rejects.toThrow(FileTooLargeError);
  });

  it('deve rejeitar tipos de arquivo não permitidos', async () => {
    const input = {
      orderId: '1',
      file: {
        buffer: Buffer.from('test'),
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
      } as any,
    };

    await expect(sut.execute(input)).rejects.toThrow(InvalidMimeTypeError);
  });
});
