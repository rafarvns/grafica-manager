import { PrismaClient } from '@prisma/client';
import { PrintPresetRepository } from '@/domain/repositories/PrintPresetRepository';
import { PrintPreset, CreatePrintPresetDTO, UpdatePrintPresetDTO } from '@grafica/shared';

export class PrismaPrintPresetRepository implements PrintPresetRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePrintPresetDTO): Promise<PrintPreset> {
    const preset = await this.prisma.printPreset.create({
      data: {
        name: data.name,
        paperTypeId: data.paperTypeId,
        quality: data.quality as any,
        colors: data.colors as any,
        finish: data.finish as any,
        active: data.active ?? true,
      },
    });

    return this.mapToDomain(preset);
  }

  async findById(id: string): Promise<PrintPreset | null> {
    const preset = await this.prisma.printPreset.findUnique({
      where: { id },
    });

    if (!preset) return null;
    return this.mapToDomain(preset);
  }

  async findAll(filters?: { activeOnly?: boolean; includeDeleted?: boolean }): Promise<PrintPreset[]> {
    const where: any = {};
    if (filters?.activeOnly) where.active = true;
    if (!filters?.includeDeleted) where.deletedAt = null;

    const presets = await this.prisma.printPreset.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return presets.map(this.mapToDomain);
  }

  async update(id: string, data: UpdatePrintPresetDTO): Promise<PrintPreset> {
    const preset = await this.prisma.printPreset.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.paperTypeId && { paperTypeId: data.paperTypeId }),
        ...(data.quality && { quality: data.quality as any }),
        ...(data.colors && { colors: data.colors as any }),
        ...(data.finish && { finish: data.finish as any }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return this.mapToDomain(preset);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.printPreset.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<PrintPreset> {
    const preset = await this.prisma.printPreset.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        active: false 
      },
    });

    return this.mapToDomain(preset);
  }

  async countActiveOrders(presetId: string): Promise<number> {
    // Presets are used in PrintJobs via paperTypeId and settings, but not directly linked by ID in the current schema
    // Unless we add a presetId to PrintJob. For now, we return 0 or implement based on logic.
    // Spec doesn't strictly require this for presets yet, but good for parity.
    return 0;
  }

  private mapToDomain(preset: any): PrintPreset {
    return {
      id: preset.id,
      name: preset.name,
      paperTypeId: preset.paperTypeId,
      quality: preset.quality,
      colors: preset.colors,
      finish: preset.finish,
      active: preset.active,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
      deletedAt: preset.deletedAt,
    };
  }
}
