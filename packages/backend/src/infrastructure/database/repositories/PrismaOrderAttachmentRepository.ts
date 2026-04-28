import { PrismaClient } from '@prisma/client';
import { OrderAttachment } from '@/domain/entities/OrderAttachment';
import { OrderAttachmentRepository } from '@/domain/repositories/OrderAttachmentRepository';

export class PrismaOrderAttachmentRepository implements OrderAttachmentRepository {
  constructor(private prisma: PrismaClient) {}

  async save(attachment: OrderAttachment): Promise<void> {
    await this.prisma.orderAttachment.upsert({
      where: { id: attachment.id },
      create: {
        id: attachment.id,
        orderId: attachment.orderId,
        filename: attachment.filename,
        originalFilename: attachment.originalFilename,
        filepath: attachment.filepath,
        size: attachment.size,
        mimeType: attachment.mimeType,
        uploadedAt: attachment.uploadedAt,
        deletedAt: attachment.deletedAt,
      },
      update: {
        filename: attachment.filename,
        originalFilename: attachment.originalFilename,
        filepath: attachment.filepath,
        size: attachment.size,
        mimeType: attachment.mimeType,
        deletedAt: attachment.deletedAt,
      },
    });
  }

  async findById(id: string): Promise<OrderAttachment | null> {
    const data = await this.prisma.orderAttachment.findUnique({
      where: { id },
    });

    if (!data) return null;

    return new OrderAttachment({
      id: data.id,
      orderId: data.orderId,
      filename: data.filename,
      originalFilename: data.originalFilename,
      filepath: data.filepath,
      size: data.size,
      mimeType: data.mimeType,
      uploadedAt: data.uploadedAt,
      deletedAt: data.deletedAt,
    });
  }

  async findByOrderId(orderId: string): Promise<OrderAttachment[]> {
    const items = await this.prisma.orderAttachment.findMany({
      where: {
        orderId,
        deletedAt: null,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return items.map(item => new OrderAttachment({
      id: item.id,
      orderId: item.orderId,
      filename: item.filename,
      originalFilename: item.originalFilename,
      filepath: item.filepath,
      size: item.size,
      mimeType: item.mimeType,
      uploadedAt: item.uploadedAt,
      deletedAt: item.deletedAt,
    }));
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.orderAttachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async deletePhysical(id: string): Promise<void> {
    await this.prisma.orderAttachment.delete({
      where: { id },
    });
  }

  async findExpiredForRetention(cutoffDate: Date): Promise<OrderAttachment[]> {
    const items = await this.prisma.orderAttachment.findMany({
      where: {
        OR: [
          {
            order: {
              status: { in: ['cancelled', 'shipping'] },
              updatedAt: { lt: cutoffDate },
            },
          },
          {
            deletedAt: { lt: cutoffDate },
          }
        ]
      },
      include: { order: true }
    });

    return items.map(item => new OrderAttachment({
      id: item.id,
      orderId: item.orderId,
      filename: item.filename,
      originalFilename: item.originalFilename,
      filepath: item.filepath,
      size: item.size,
      mimeType: item.mimeType,
      uploadedAt: item.uploadedAt,
      deletedAt: item.deletedAt,
    }));
  }
}
