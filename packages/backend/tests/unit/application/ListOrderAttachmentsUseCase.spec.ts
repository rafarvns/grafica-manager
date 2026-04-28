import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListOrderAttachmentsUseCase } from '@/application/use-cases/ListOrderAttachmentsUseCase';
import { OrderAttachmentRepository } from '@/domain/repositories/OrderAttachmentRepository';
import { OrderAttachment } from '@/domain/entities/OrderAttachment';

describe('ListOrderAttachmentsUseCase', () => {
  let sut: ListOrderAttachmentsUseCase;
  let repository: OrderAttachmentRepository;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByOrderId: vi.fn().mockResolvedValue([
        new OrderAttachment({
          id: '1',
          orderId: 'order-1',
          filename: 'file1.pdf',
          originalFilename: 'original1.pdf',
          filepath: 'path/1',
          size: 100,
          mimeType: 'application/pdf',
        }),
        new OrderAttachment({
          id: '2',
          orderId: 'order-1',
          filename: 'file2.jpg',
          originalFilename: 'original2.jpg',
          filepath: 'path/2',
          size: 200,
          mimeType: 'image/jpeg',
        }),
      ]),
      softDelete: vi.fn(),
      deletePhysical: vi.fn(),
      findExpiredForRetention: vi.fn(),
    };

    sut = new ListOrderAttachmentsUseCase(repository);
  });

  it('deve listar anexos de um pedido', async () => {
    const result = await sut.execute('order-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
    expect(repository.findByOrderId).toHaveBeenCalledWith('order-1');
  });

  it('deve retornar lista vazia se não houver anexos', async () => {
    vi.mocked(repository.findByOrderId).mockResolvedValueOnce([]);
    const result = await sut.execute('order-2');
    expect(result).toHaveLength(0);
  });
});
