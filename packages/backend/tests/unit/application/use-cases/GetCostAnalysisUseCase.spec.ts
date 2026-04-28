import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetCostAnalysisUseCase } from '@/application/use-cases/GetCostAnalysisUseCase';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

describe('GetCostAnalysisUseCase', () => {
  let mockRepo: any;
  let useCase: GetCostAnalysisUseCase;

  beforeEach(() => {
    mockRepo = {
      sumRevenueInPeriod: vi.fn().mockResolvedValue(10000),
      sumCostInPeriod: vi.fn().mockResolvedValue(3000),
    };
    useCase = new GetCostAnalysisUseCase(mockRepo);
  });

  describe('Cálculo de margem bruta', () => {
    it('deve calcular grossMargin = 7000 com revenue 10000 e cost 3000', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.grossMargin).toBe(7000);
    });

    it('deve calcular grossMarginPercent = 70 com revenue 10000 e cost 3000', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.grossMarginPercent).toBe(70);
    });

    it('deve retornar grossMarginPercent = 0 quando revenue é zero', async () => {
      mockRepo.sumRevenueInPeriod.mockResolvedValue(0);
      mockRepo.sumCostInPeriod.mockResolvedValue(0);
      const result = await useCase.execute({ period: PeriodFilter.today() });
      expect(result.grossMarginPercent).toBe(0);
      expect(result.grossMargin).toBe(0);
    });

    it('deve calcular margem negativa quando custo supera receita', async () => {
      mockRepo.sumRevenueInPeriod.mockResolvedValue(1000);
      mockRepo.sumCostInPeriod.mockResolvedValue(1500);
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.grossMargin).toBe(-500);
      expect(result.grossMarginPercent).toBe(-50);
    });

    it('deve retornar grossMarginPercent = 100 quando cost é zero', async () => {
      mockRepo.sumCostInPeriod.mockResolvedValue(0);
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.grossMarginPercent).toBe(100);
    });
  });

  describe('Campos do resultado', () => {
    it('deve retornar revenue correto', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.revenue).toBe(10000);
    });

    it('deve retornar cost correto', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.cost).toBe(3000);
    });

    it('deve retornar objeto com todos os campos obrigatórios', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('cost');
      expect(result).toHaveProperty('grossMargin');
      expect(result).toHaveProperty('grossMarginPercent');
    });
  });

  describe('Chamadas ao repositório', () => {
    it('deve chamar sumRevenueInPeriod com as datas corretas', async () => {
      const period = PeriodFilter.custom(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      await useCase.execute({ period });
      expect(mockRepo.sumRevenueInPeriod).toHaveBeenCalledWith(period.from, period.to);
    });

    it('deve chamar sumCostInPeriod com as datas corretas', async () => {
      const period = PeriodFilter.lastSevenDays();
      await useCase.execute({ period });
      expect(mockRepo.sumCostInPeriod).toHaveBeenCalledWith(period.from, period.to);
    });
  });
});
