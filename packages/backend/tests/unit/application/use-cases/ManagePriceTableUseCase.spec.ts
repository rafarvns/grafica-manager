import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ManagePriceTableUseCase } from '@/application/use-cases/ManagePriceTableUseCase';
import {
  CreatePriceTableInput,
  UpdatePriceTableInput,
  PriceTableOutput,
} from '@/application/dtos/ManagePriceTableDTO';

const mockPriceTableRepository = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findByPaperTypeAndQuality: vi.fn(),
};

const mockPrintJobRepository = {
  countByPriceTableEntry: vi.fn(),
};

describe('ManagePriceTableUseCase', () => {
  let useCase: ManagePriceTableUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ManagePriceTableUseCase(mockPriceTableRepository, mockPrintJobRepository);
  });

  describe('Criar entrada de preço', () => {
    it('deve criar entrada de preço válida', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      };

      const expectedOutput: PriceTableOutput = {
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
        createdAt: expect.any(Date),
      };

      mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValue(null);
      mockPriceTableRepository.create.mockResolvedValue(expectedOutput);

      const result = await useCase.createPrice(input);

      expect(mockPriceTableRepository.findByPaperTypeAndQuality).toHaveBeenCalledWith(
        'paper-123',
        'normal'
      );
      expect(mockPriceTableRepository.create).toHaveBeenCalledWith({
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });
      expect(result).toEqual(expectedOutput);
    });

    it('deve lançar erro se preço já existe para papel + qualidade', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      };

      mockPriceTableRepository.findByPaperTypeAndQuality.mockResolvedValue({
        id: 'price-existing',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.40,
      });

      await expect(useCase.createPrice(input)).rejects.toThrow(
        'Já existe um preço para este papel e qualidade'
      );
    });

    it('deve validar unitPrice > 0', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0,
      };

      await expect(useCase.createPrice(input)).rejects.toThrow('Preço unitário deve ser > 0');
    });

    it('deve validar quality válida', async () => {
      const input: CreatePriceTableInput = {
        paperTypeId: 'paper-123',
        quality: 'invalid-quality',
        unitPrice: 0.50,
      };

      await expect(useCase.createPrice(input)).rejects.toThrow(
        'Qualidade inválida. Aceitas: rascunho, normal, alta'
      );
    });
  });

  describe('Atualizar entrada de preço', () => {
    it('deve atualizar preço existente', async () => {
      const input: UpdatePriceTableInput = {
        id: 'price-1',
        unitPrice: 0.60,
      };

      const expectedOutput: PriceTableOutput = {
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.60,
        createdAt: new Date(),
      };

      mockPriceTableRepository.findById.mockResolvedValue({
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });
      mockPriceTableRepository.update.mockResolvedValue(expectedOutput);

      const result = await useCase.updatePrice(input);

      expect(mockPriceTableRepository.findById).toHaveBeenCalledWith('price-1');
      expect(mockPriceTableRepository.update).toHaveBeenCalledWith('price-1', {
        unitPrice: 0.60,
      });
      expect(result).toEqual(expectedOutput);
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
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });

      await expect(useCase.updatePrice(input)).rejects.toThrow('Preço unitário deve ser > 0');
    });

    it('deve permitir atualizar preço mesmo com histórico de uso', async () => {
      const input: UpdatePriceTableInput = {
        id: 'price-1',
        unitPrice: 0.60,
      };

      mockPriceTableRepository.findById.mockResolvedValue({
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });

      mockPrintJobRepository.countByPriceTableEntry.mockResolvedValue(100);

      mockPriceTableRepository.update.mockResolvedValue({
        id: 'price-1',
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.60,
        createdAt: new Date(),
      });

      const result = await useCase.updatePrice(input);

      expect(result.unitPrice).toBe(0.60);
      // Histórico não é afetado (apenas novos registros usam novo preço)
    });
  });

  describe('Deletar entrada de preço', () => {
    it('deve deletar preço sem uso', async () => {
      const priceId = 'price-1';

      mockPriceTableRepository.findById.mockResolvedValue({
        id: priceId,
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });

      mockPrintJobRepository.countByPriceTableEntry.mockResolvedValue(0);
      mockPriceTableRepository.delete.mockResolvedValue(true);

      const result = await useCase.deletePrice(priceId);

      expect(mockPriceTableRepository.delete).toHaveBeenCalledWith(priceId);
      expect(result).toEqual({ success: true, message: 'Preço deletado com sucesso' });
    });

    it('deve lançar erro se preço não encontrado', async () => {
      mockPriceTableRepository.findById.mockResolvedValue(null);

      await expect(useCase.deletePrice('price-invalid')).rejects.toThrow(
        'Preço não encontrado'
      );
    });

    it('deve lançar erro se preço está em uso', async () => {
      const priceId = 'price-1';

      mockPriceTableRepository.findById.mockResolvedValue({
        id: priceId,
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });

      mockPrintJobRepository.countByPriceTableEntry.mockResolvedValue(15);

      await expect(useCase.deletePrice(priceId)).rejects.toThrow(
        'Este preço está em uso por 15 registros de impressão'
      );
    });

    it('deve permitir deleção forçada com force=true mesmo em uso', async () => {
      const priceId = 'price-1';

      mockPriceTableRepository.findById.mockResolvedValue({
        id: priceId,
        paperTypeId: 'paper-123',
        quality: 'normal',
        unitPrice: 0.50,
      });

      mockPrintJobRepository.countByPriceTableEntry.mockResolvedValue(15);
      mockPriceTableRepository.delete.mockResolvedValue(true);

      const result = await useCase.deletePrice(priceId, { force: true });

      expect(mockPriceTableRepository.delete).toHaveBeenCalledWith(priceId);
      expect(result.warning).toBe('Preço estava em uso por 15 registro(s)');
    });
  });

  describe('Listar preços', () => {
    it('deve listar todas as entradas de preço', async () => {
      const prices = [
        {
          id: 'price-1',
          paperTypeId: 'paper-123',
          quality: 'normal',
          unitPrice: 0.50,
        },
        {
          id: 'price-2',
          paperTypeId: 'paper-456',
          quality: 'alta',
          unitPrice: 1.00,
        },
      ];

      mockPriceTableRepository.findAll.mockResolvedValue(prices);

      const result = await useCase.listPrices();

      expect(result).toEqual(prices);
    });
  });
});
