import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ManagePriceTableUseCase } from '@/application/use-cases/ManagePriceTableUseCase';
import {
  CreatePriceTableInput,
  UpdatePriceTableInput,
} from '@/application/dtos/ManagePriceTableDTO';

const mockPriceTableRepository = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findByCombination: vi.fn(),
};

const mockPrintJobRepository = {
  countByPriceTableEntry: vi.fn(),
};

describe('ManagePriceTableUseCase', () => {
  let useCase: ManagePriceTableUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ManagePriceTableUseCase(mockPriceTableRepository as any, mockPrintJobRepository as any);
  });

  describe('Criar entrada de preço', () => {
    it('deve criar entrada de preço válida', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'padrão',
        colors: 'colorido',
        unitPrice: 0.50,
      };

      const repoOutput: any = {
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'padrão',
        colors: 'colorido',
        unitPrice: 0.50,
        createdAt: new Date(),
      };

      mockPriceTableRepository.findByCombination.mockResolvedValue(null);
      mockPriceTableRepository.create.mockResolvedValue(repoOutput);

      const result = await useCase.createPrice(input);

      expect(mockPriceTableRepository.findByCombination).toHaveBeenCalledWith(
        'paper-123',
        'padrão',
        'colorido'
      );
      expect(mockPriceTableRepository.create).toHaveBeenCalledWith({
        paperTypeId: 'paper-123',
        quality: 'padrão',
        colors: 'colorido',
        unitPrice: 0.50,
        validUntil: undefined,
      });
      
      expect(result).toEqual({
        id: repoOutput.id,
        paperTypeId: repoOutput.paperTypeId,
        quality: repoOutput.quality,
        colors: repoOutput.colors,
        unitPrice: repoOutput.unitPrice,
        validUntil: undefined,
        createdAt: repoOutput.createdAt,
      });
    });

    it('deve lançar erro se preço já existe para combinação', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'padrão',
        colors: 'colorido',
        unitPrice: 0.50,
      };

      mockPriceTableRepository.findByCombination.mockResolvedValue({
        id: 'price-existing',
      });

      await expect(useCase.createPrice(input)).rejects.toThrow(
        'Já existe um preço para esta combinação de papel, qualidade e cores'
      );
    });

    it('deve validar unitPrice > 0', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'padrão',
        colors: 'colorido',
        unitPrice: 0,
      };

      await expect(useCase.createPrice(input)).rejects.toThrow('Preço unitário deve ser > 0');
    });
  });

  describe('Atualizar entrada de preço', () => {
    it('deve atualizar preço existente', async () => {
      const input: UpdatePriceTableInput = {
        id: 'price-1',
        unitPrice: 0.60,
      };

      const repoOutput: any = {
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'padrão',
        colors: 'colorido',
        unitPrice: 0.60,
        createdAt: new Date(),
      };

      mockPriceTableRepository.findById.mockResolvedValue({
        id: 'price-1',
      });
      mockPriceTableRepository.update.mockResolvedValue(repoOutput);

      const result = await useCase.updatePrice(input);

      expect(mockPriceTableRepository.update).toHaveBeenCalledWith('price-1', {
        unitPrice: 0.60,
      });
      expect(result.unitPrice).toBe(0.60);
    });

    it('deve lançar erro se preço não encontrado', async () => {
      const input: UpdatePriceTableInput = {
        id: 'price-invalid',
        unitPrice: 0.60,
      };

      mockPriceTableRepository.findById.mockResolvedValue(null);

      await expect(useCase.updatePrice(input)).rejects.toThrow('Preço não encontrado');
    });

    it('deve validar unitPrice > 0 na atualização', async () => {
      const input: UpdatePriceTableInput = {
        id: 'price-1',
        unitPrice: -0.50,
      };

      mockPriceTableRepository.findById.mockResolvedValue({
        id: 'price-1',
      });

      await expect(useCase.updatePrice(input)).rejects.toThrow('Preço unitário deve ser > 0');
    });
  });

  describe('Deletar entrada de preço', () => {
    it('deve deletar preço sem uso', async () => {
      const priceId = 'price-1';

      mockPriceTableRepository.findById.mockResolvedValue({
        id: priceId,
      });

      mockPrintJobRepository.countByPriceTableEntry.mockResolvedValue(0);
      mockPriceTableRepository.delete.mockResolvedValue(true);

      const result = await useCase.deletePrice(priceId);

      expect(mockPriceTableRepository.delete).toHaveBeenCalledWith(priceId);
      expect(result).toEqual({ success: true, message: 'Preço deletado com sucesso' });
    });

    it('deve lançar erro se preço está em uso', async () => {
      const priceId = 'price-1';

      mockPriceTableRepository.findById.mockResolvedValue({
        id: priceId,
      });

      mockPrintJobRepository.countByPriceTableEntry.mockResolvedValue(15);

      await expect(useCase.deletePrice(priceId)).rejects.toThrow(
        'Este preço está em uso por 15 registros de impressão'
      );
    });
  });

  describe('Listar preços', () => {
    it('deve listar todas as entradas de preço', async () => {
      const prices = [
        {
          id: 'price-1',
          paperTypeId: 'paper-123',
          quality: 'padrão',
          colors: 'colorido',
          unitPrice: 0.50,
          createdAt: new Date(),
        },
      ];

      mockPriceTableRepository.findAll.mockResolvedValue(prices);

      const result = await useCase.listPrices();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('price-1');
    });
  });
});
