import { PrismaClient } from '@prisma/client';
import { PriceTableRepository } from '@/domain/repositories/PriceTableRepository';
import { PriceTableEntry, CreatePriceTableEntryDTO, UpdatePriceTableEntryDTO } from '@grafica/shared';

export class PrismaPriceTableRepository implements PriceTableRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePriceTableEntryDTO): Promise<PriceTableEntry> {
    const entry = await this.prisma.priceTableEntry.create({
      data: {
        paperTypeId: data.paperTypeId,
        quality: data.quality as any,
        colors: data.colors as any,
        unitPrice: data.unitPrice,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });

    return this.mapToDomain(entry);
  }

  async findById(id: string): Promise<PriceTableEntry | null> {
    const entry = await this.prisma.priceTableEntry.findUnique({
      where: { id },
    });

    if (!entry) return null;
    return this.mapToDomain(entry);
  }

  async findByCombination(paperTypeId: string, quality: string, colors: string): Promise<PriceTableEntry | null> {
    const entry = await this.prisma.priceTableEntry.findFirst({
      where: {
        paperTypeId,
        quality: quality as any,
        colors: colors as any,
      },
    });

    if (!entry) return null;
    return this.mapToDomain(entry);
  }

  async findAll(filters?: { activeOnly?: boolean }): Promise<PriceTableEntry[]> {
    const where: any = {};
    // PriceTableEntry doesn't have 'active' field in current schema, we could filter by validUntil
    
    const entries = await this.prisma.priceTableEntry.findMany({
      where,
      orderBy: [
        { paperTypeId: 'asc' },
        { quality: 'asc' }
      ],
    });

    return entries.map(this.mapToDomain);
  }

  async update(id: string, data: UpdatePriceTableEntryDTO): Promise<PriceTableEntry> {
    const entry = await this.prisma.priceTableEntry.update({
      where: { id },
      data: {
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.validUntil !== undefined && { validUntil: data.validUntil ? new Date(data.validUntil) : null }),
      },
    });

    return this.mapToDomain(entry);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.priceTableEntry.delete({
      where: { id },
    });
  }

  private mapToDomain(entry: any): PriceTableEntry {
    return {
      id: entry.id,
      paperTypeId: entry.paperTypeId,
      quality: entry.quality,
      colors: entry.colors,
      unitPrice: Number(entry.unitPrice),
      validUntil: entry.validUntil,
      active: true, // Mocked as active is not in schema but expected by interface
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
