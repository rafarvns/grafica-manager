import {
  CreatePriceTableInput,
  UpdatePriceTableInput,
  PriceTableOutput,
  DeletePriceTableOutput,
} from '@/application/dtos/ManagePriceTableDTO';
import { PriceTableRepository } from '@/domain/repositories/PriceTableRepository';
import { PrintQuality, ColorMode } from '@grafica/shared';

export interface IPrintJobRepository {
  countByPriceTableEntry(priceTableEntryId: string): Promise<number>;
}

export interface DeleteOptions {
  force?: boolean;
}

export class ManagePriceTableUseCase {
  constructor(
    private priceTableRepository: PriceTableRepository,
    private printJobRepository: IPrintJobRepository
  ) {}

  async createPrice(input: CreatePriceTableInput): Promise<PriceTableOutput> {
    // Validar unitPrice
    if (input.unitPrice <= 0) {
      throw new Error('Preço unitário deve ser > 0');
    }

    if (input.maxPages !== undefined && input.maxPages < 1) {
      throw new Error('Quantidade máxima de páginas deve ser >= 1');
    }

    const quality = input.quality as PrintQuality;
    const colors = input.colors as ColorMode;

    // Verificar duplicação
    const existing = await this.priceTableRepository.findByCombination(
      input.paperTypeId,
      quality,
      colors
    );

    if (existing) {
      throw new Error('Já existe um preço para esta combinação de papel, qualidade e cores');
    }

    // Criar
    const price = await this.priceTableRepository.create({
      name: input.name,
      description: input.description,
      friendlyCode: input.friendlyCode!,
      paperTypeId: input.paperTypeId,
      quality,
      colors,
      unitPrice: input.unitPrice,
      validUntil: input.validUntil as any,
      maxPages: input.maxPages ?? 1,
    });

    return {
      id: price.id,
      name: price.name,
      description: price.description,
      friendlyCode: price.friendlyCode,
      paperTypeId: price.paperTypeId,
      quality: price.quality,
      colors: price.colors,
      unitPrice: price.unitPrice,
      validUntil: price.validUntil as any,
      maxPages: price.maxPages,
      createdAt: price.createdAt,
    };
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

    // Atualizar
    const updated = await this.priceTableRepository.update(input.id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
      ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
      ...(input.maxPages !== undefined && { maxPages: input.maxPages }),
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      friendlyCode: updated.friendlyCode,
      paperTypeId: updated.paperTypeId,
      quality: updated.quality,
      colors: updated.colors,
      unitPrice: updated.unitPrice,
      validUntil: updated.validUntil as any,
      maxPages: updated.maxPages,
      createdAt: updated.createdAt,
    };
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
    const prices = await this.priceTableRepository.findAll();
    return prices.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      friendlyCode: p.friendlyCode,
      paperTypeId: p.paperTypeId,
      quality: p.quality,
      colors: p.colors,
      unitPrice: p.unitPrice,
      validUntil: p.validUntil as any,
      maxPages: p.maxPages,
      createdAt: p.createdAt,
    }));
  }
}
