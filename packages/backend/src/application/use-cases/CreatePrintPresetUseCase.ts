import { CreatePrintPresetInput, CreatePrintPresetOutput } from '@/application/dtos/CreatePrintPresetDTO';

export interface IPrintPresetRepository {
  create(data: any): Promise<CreatePrintPresetOutput>;
  findByName(name: string): Promise<any>;
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
  findByPaperTypeId(paperTypeId: string): Promise<any[]>;
}

export interface IPaperTypeRepository {
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
}

const VALID_COLOR_MODES = ['CMYK', 'RGB', 'GRAYSCALE'];
const VALID_QUALITIES = ['rascunho', 'normal', 'alta'];
const VALID_DPIS = [150, 300, 600];

export class CreatePrintPresetUseCase {
  constructor(
    private printPresetRepository: IPrintPresetRepository,
    private paperTypeRepository: IPaperTypeRepository
  ) {}

  async execute(input: CreatePrintPresetInput): Promise<CreatePrintPresetOutput> {
    // Validar nome
    const name = input.name.trim();
    if (!name) {
      throw new Error('Nome do preset é obrigatório');
    }

    // Validar color mode
    if (!VALID_COLOR_MODES.includes(input.colorMode)) {
      throw new Error(`Color mode inválido. Aceitos: ${VALID_COLOR_MODES.join(', ')}`);
    }

    // Validar tipo de papel existe
    const paperType = await this.paperTypeRepository.findById(input.paperTypeId);
    if (!paperType) {
      throw new Error('Tipo de papel não encontrado');
    }

    // Validar qualidade
    if (!VALID_QUALITIES.includes(input.quality)) {
      throw new Error(`Qualidade inválida. Aceitas: ${VALID_QUALITIES.join(', ')}`);
    }

    // Validar DPI
    if (!VALID_DPIS.includes(input.dpi)) {
      throw new Error(`DPI inválido. Aceitos: ${VALID_DPIS.join(', ')}`);
    }

    // Verificar duplicação
    const existingPreset = await this.printPresetRepository.findByName(name);
    if (existingPreset) {
      throw new Error('Já existe um preset com este nome');
    }

    // Criar preset
    const preset = await this.printPresetRepository.create({
      name,
      colorMode: input.colorMode,
      paperTypeId: input.paperTypeId,
      quality: input.quality,
      dpi: input.dpi,
    });

    return {
      ...preset,
      paperTypeName: paperType.name,
    };
  }
}
