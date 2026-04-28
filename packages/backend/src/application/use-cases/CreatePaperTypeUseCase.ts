import { CreatePaperTypeInput, CreatePaperTypeOutput } from '@/application/dtos/CreatePaperTypeDTO';

export interface IPaperTypeRepository {
  create(data: any): Promise<CreatePaperTypeOutput>;
  findByName(name: string): Promise<any>;
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<boolean>;
}

export class CreatePaperTypeUseCase {
  constructor(private paperTypeRepository: IPaperTypeRepository) {}

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
      standardSize: input.standardSize,
      color: input.color,
    });

    return paper;
  }
}
