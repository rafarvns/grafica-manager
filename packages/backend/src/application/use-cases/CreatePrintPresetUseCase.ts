import { CreatePrintPresetInput, CreatePrintPresetOutput } from '@/application/dtos/CreatePrintPresetDTO';
import { PrintPresetRepository } from '@/domain/repositories/PrintPresetRepository';
import { PaperTypeRepository } from '@/domain/repositories/PaperTypeRepository';
import { PrintQuality, ColorMode, FinishType } from '@grafica/shared';

export class CreatePrintPresetUseCase {
  constructor(
    private printPresetRepository: PrintPresetRepository,
    private paperTypeRepository: PaperTypeRepository
  ) {}

  async execute(input: CreatePrintPresetInput): Promise<CreatePrintPresetOutput> {
    // Validar nome
    const name = input.name.trim();
    if (!name) {
      throw new Error('Nome do preset é obrigatório');
    }

    // Validar tipo de papel existe
    const paperType = await this.paperTypeRepository.findById(input.paperTypeId);
    if (!paperType) {
      throw new Error('Tipo de papel não encontrado');
    }

    // Verificar duplicação
    const allPresets = await this.printPresetRepository.findAll();
    const existingPreset = allPresets.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingPreset) {
      throw new Error('Já existe um preset com este nome');
    }

    // Criar preset
    const preset = await this.printPresetRepository.create({
      name,
      paperTypeId: input.paperTypeId,
      quality: input.quality as PrintQuality,
      colors: input.colors as ColorMode,
      finish: input.finish as FinishType,
      active: input.active ?? true,
    });

    return {
      id: preset.id,
      name: preset.name,
      paperTypeId: preset.paperTypeId,
      paperTypeName: paperType.name,
      quality: preset.quality,
      colors: preset.colors,
      finish: preset.finish,
      active: preset.active,
      createdAt: preset.createdAt,
    };
  }
}
