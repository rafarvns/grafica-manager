import { PrismaClient } from '@prisma/client';
import { PaperTypeRepository } from '@/domain/repositories/PaperTypeRepository';
import { PaperType, CreatePaperTypeDTO, UpdatePaperTypeDTO } from '@grafica/shared';

export class PrismaPaperTypeRepository implements PaperTypeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePaperTypeDTO): Promise<PaperType> {
    const paperType = await this.prisma.paperType.create({
      data: {
        name: data.name,
        gsm: data.weight,
        size: data.size as any,
        color: data.color,
        active: data.active ?? true,
      },
    });

    return this.mapToDomain(paperType);
  }

  async findById(id: string): Promise<PaperType | null> {
    const paperType = await this.prisma.paperType.findUnique({
      where: { id },
    });

    if (!paperType) return null;
    return this.mapToDomain(paperType);
  }

  async findByName(name: string): Promise<PaperType | null> {
    const paperType = await this.prisma.paperType.findFirst({
      where: { name, deletedAt: null },
    });

    if (!paperType) return null;
    return this.mapToDomain(paperType);
  }

  async findAll(filters?: { activeOnly?: boolean; includeDeleted?: boolean }): Promise<PaperType[]> {
    const where: any = {};
    if (filters?.activeOnly) where.active = true;
    if (!filters?.includeDeleted) where.deletedAt = null;

    const paperTypes = await this.prisma.paperType.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return paperTypes.map(this.mapToDomain);
  }

  async update(id: string, data: UpdatePaperTypeDTO): Promise<PaperType> {
    const paperType = await this.prisma.paperType.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.weight && { gsm: data.weight }),
        ...(data.size && { size: data.size as any }),
        ...(data.color && { color: data.color }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return this.mapToDomain(paperType);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paperType.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<PaperType> {
    const paperType = await this.prisma.paperType.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        active: false 
      },
    });

    return this.mapToDomain(paperType);
  }

  async countActiveOrders(paperTypeId: string): Promise<number> {
    return await this.prisma.printJob.count({
      where: {
        paperTypeId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'] as any
        }
      }
    });
  }

  private mapToDomain(paperType: any): PaperType {
    return {
      id: paperType.id,
      name: paperType.name,
      weight: paperType.gsm,
      size: paperType.size,
      color: paperType.color,
      active: paperType.active,
      createdAt: paperType.createdAt,
      updatedAt: paperType.updatedAt,
      deletedAt: paperType.deletedAt,
    };
  }
}
