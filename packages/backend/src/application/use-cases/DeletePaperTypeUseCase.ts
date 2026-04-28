export interface IPaperTypeRepository {
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<any>;
}

export interface IPrintPresetRepository {
  findByPaperTypeId(paperTypeId: string): Promise<any[]>;
}

export interface DeletePaperTypeOptions {
  force?: boolean;
}

export interface DeletePaperTypeOutput {
  success: boolean;
  message: string;
  warning?: string;
}

export class DeletePaperTypeUseCase {
  constructor(
    private paperTypeRepository: IPaperTypeRepository,
    private printPresetRepository: IPrintPresetRepository
  ) {}

  async execute(
    paperId: string,
    options: DeletePaperTypeOptions = {}
  ): Promise<DeletePaperTypeOutput> {
    // Verificar se tipo de papel existe
    const paperType = await this.paperTypeRepository.findById(paperId);
    if (!paperType) {
      throw new Error('Tipo de papel não encontrado');
    }

    // Verificar se está em uso
    const presetsInUse = await this.printPresetRepository.findByPaperTypeId(paperId);
    const presetsCount = presetsInUse.length;

    if (presetsCount > 0 && !options.force) {
      throw new Error(
        `Este tipo de papel está em uso por ${presetsCount} preset(s). ` +
          'Para deletar mesmo assim, use a flag force=true.'
      );
    }

    // Deletar
    await this.paperTypeRepository.delete(paperId);

    const result: DeletePaperTypeOutput = {
      success: true,
      message: 'Tipo de papel deletado com sucesso',
    };

    if (presetsCount > 0 && options.force) {
      result.warning = `Tipo de papel estava em uso por ${presetsCount} preset(s)`;
    }

    return result;
  }
}
