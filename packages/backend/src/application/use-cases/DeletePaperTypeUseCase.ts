import { PaperTypeRepository } from '@/domain/repositories/PaperTypeRepository';

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
    private paperTypeRepository: PaperTypeRepository
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

    // Verificar se está em uso em pedidos ativos (Spec 0022)
    const activeOrdersCount = await this.paperTypeRepository.countActiveOrders(paperId);

    if (activeOrdersCount > 0 && !options.force) {
      throw new Error(
        `Tipo de papel está em uso em ${activeOrdersCount} pedidos ativos. Desative ao invés de deletar.`
      );
    }

    // Deletar
    await this.paperTypeRepository.delete(paperId);

    return {
      success: true,
      message: 'Tipo de papel deletado com sucesso',
    };
  }

  async toggleActive(paperId: string, active: boolean): Promise<any> {
    const paperType = await this.paperTypeRepository.findById(paperId);
    if (!paperType) {
      throw new Error('Tipo de papel não encontrado');
    }

    // Usando softDelete do repositório (que na verdade é um update de status no caso de toggle)
    // Se o repositório seguisse o nome do plano, seria softDelete.
    return await this.paperTypeRepository.softDelete(paperId);
  }
}
