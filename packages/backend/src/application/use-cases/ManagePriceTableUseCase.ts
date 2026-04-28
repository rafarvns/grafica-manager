import {
  CreatePriceTableInput,
  UpdatePriceTableInput,
  PriceTableOutput,
  DeletePriceTableOutput,
} from '@/application/dtos/ManagePriceTableDTO';

const VALID_QUALITIES = ['rascunho', 'normal', 'alta'];

export interface IPriceTableRepository {
  create(data: any): Promise<PriceTableOutput>;
  update(id: string, data: any): Promise<PriceTableOutput>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<any>;
  findAll(): Promise<PriceTableOutput[]>;
  findByPaperTypeAndQuality(paperTypeId: string, quality: string): Promise<any>;
}

export interface IPrintJobRepository {
  countByPriceTableEntry(priceTableEntryId: string): Promise<number>;
}

export interface DeleteOptions {
  force?: boolean;
}

export class ManagePriceTableUseCase {
  constructor(
    private priceTableRepository: IPriceTableRepository,
    private printJobRepository: IPrintJobRepository
  ) {}

  async createPrice(input: CreatePriceTableInput): Promise<PriceTableOutput> {
    // Validar quality
    if (!VALID_QUALITIES.includes(input.quality)) {
      throw new Error(`Qualidade inválida. Aceitas: ${VALID_QUALITIES.join(', ')}`);
    }

    // Validar unitPrice
    if (input.unitPrice <= 0) {
      throw new Error('Preço unitário deve ser > 0');
    }

    // Verificar duplicação
    const existing = await this.priceTableRepository.findByPaperTypeAndQuality(
      input.paperTypeId,
      input.quality
    );

    if (existing) {
      throw new Error('Já existe um preço para este papel e qualidade');
    }

    // Criar
    const price = await this.priceTableRepository.create({
      paperTypeId: input.paperTypeId,
      quality: input.quality,
      unitPrice: input.unitPrice,
    });

    return price;
  }

  async updatePrice(input: UpdatePriceTableInput): Promise<PriceTableOutput> {
    // Verificar se preço existe
    const existing = await this.priceTableRepository.findById(input.id);
    if (!existing) {
      throw new Error('Preço não encontrado');
    }

    // Validar unitPrice se fornecido
    if (input.unitPrice !== undefined && input.unitPrice <= 0) {
      throw new Error('Preço unitário deve ser > 0');
    }

    // Atualizar (mudanças futuras não afetam histórico)
    const updated = await this.priceTableRepository.update(input.id, {
      ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
    });

    return updated;
  }

  async deletePrice(
    priceId: string,
    options: DeleteOptions = {}
  ): Promise<DeletePriceTableOutput> {
    // Verificar se preço existe
    const price = await this.priceTableRepository.findById(priceId);
    if (!price) {
      throw new Error('Preço não encontrado');
    }

    // Verificar se está em uso
    const usageCount = await this.printJobRepository.countByPriceTableEntry(priceId);

    if (usageCount > 0 && !options.force) {
      throw new Error(
        `Este preço está em uso por ${usageCount} registros de impressão. ` +
          'Para deletar mesmo assim, use a flag force=true.'
      );
    }

    // Deletar
    await this.priceTableRepository.delete(priceId);

    const result: DeletePriceTableOutput = {
      success: true,
      message: 'Preço deletado com sucesso',
    };

    if (usageCount > 0 && options.force) {
      result.warning = `Preço estava em uso por ${usageCount} registro(s)`;
    }

    return result;
  }

  async listPrices(): Promise<PriceTableOutput[]> {
    return await this.priceTableRepository.findAll();
  }
}
