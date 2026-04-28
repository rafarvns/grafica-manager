import { CreatePrintPresetOutput } from '@/application/dtos/CreatePrintPresetDTO';

export interface IPrintPresetRepository {
  findAll(): Promise<CreatePrintPresetOutput[]>;
}

export class ListPrintPresetsUseCase {
  constructor(private printPresetRepository: IPrintPresetRepository) {}

  async execute(): Promise<CreatePrintPresetOutput[]> {
    const presets = await this.printPresetRepository.findAll();
    return presets;
  }
}
