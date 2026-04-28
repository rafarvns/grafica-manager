import { CreatePaperTypeInput, CreatePaperTypeOutput } from '@/application/dtos/CreatePaperTypeDTO';
import { PaperTypeRepository } from '@/domain/repositories/PaperTypeRepository';

export class CreatePaperTypeUseCase {
  constructor(private paperTypeRepository: PaperTypeRepository) {}

  async execute(input: CreatePaperTypeInput): Promise<CreatePaperTypeOutput> {
    // Validar campos obrigatórios
    const name = input.name.trim();
    if (!name) {
      throw new Error('Nome do tipo de papel é obrigatório');
    }

    if (!input.weight || input.weight <= 0) {
      throw new Error('Peso do papel deve ser maior que 0');
    }

    // Verificar duplicação
    const existingPaper = await this.paperTypeRepository.findByName(name);
    if (existingPaper) {
      throw new Error('Já existe um tipo de papel com este nome');
    }

    // Criar
    const paper = await this.paperTypeRepository.create({
      name,
      weight: input.weight,
      size: input.standardSize as any,
      color: input.color,
      active: input.active ?? true,
    });

    return {
      id: paper.id,
      name: paper.name,
      weight: paper.weight,
      standardSize: paper.size,
      color: paper.color,
      active: paper.active,
      createdAt: paper.createdAt,
    };
  }
}
