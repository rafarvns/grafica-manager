import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/GetDashboardMetricsUseCase';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

describe('GetDashboardMetricsUseCase', () => {
  let mockRepo: any;
  let useCase: GetDashboardMetricsUseCase;

  beforeEach(() => {
    mockRepo = {
      countPrintJobsInPeriod: vi.fn().mockResolvedValue(50),
      countOpenOrders: vi.fn().mockResolvedValue(12),
      sumRevenueInPeriod: vi.fn().mockResolvedValue(10000),
      sumCostInPeriod: vi.fn().mockResolvedValue(3000),
      countNewOrdersByOriginInPeriod: vi.fn().mockResolvedValue({
        total: 20,
        byOrigin: { SHOPEE: 15, MANUAL: 5 },
      }),
      getTopCustomerInPeriod: vi.fn().mockResolvedValue({
        name: 'Cliente A',
        revenue: 3000,
      }),
    };
    useCase = new GetDashboardMetricsUseCase(mockRepo);
  });

  describe('Retorno dos 7 KPIs', () => {
    it('deve retornar printsTodayCount do repositório', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.printsTodayCount).toBe(50);
    });

    it('deve retornar openOrdersCount do repositório', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.openOrdersCount).toBe(12);
    });

    it('deve retornar revenue do repositório', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.revenue).toBe(10000);
    });

    it('deve retornar cost do repositório', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.cost).toBe(3000);
    });

    it('deve calcular grossMarginPercent = 70 com revenue 10000 e cost 3000', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.grossMarginPercent).toBe(70);
    });

    it('deve retornar newOrders com total e byOrigin', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.newOrders.total).toBe(20);
      expect(result.newOrders.byOrigin['SHOPEE']).toBe(15);
    });

    it('deve retornar topCustomer com nome e revenue', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result.topCustomer?.name).toBe('Cliente A');
    });
  });

  describe('Chamadas ao repositório com período correto', () => {
    it('deve chamar countPrintJobsInPeriod com as datas do período', async () => {
      const period = PeriodFilter.thisMonth();
      await useCase.execute({ period });
      expect(mockRepo.countPrintJobsInPeriod).toHaveBeenCalledWith(period.from, period.to);
    });

    it('deve chamar sumRevenueInPeriod com as datas do período', async () => {
      const period = PeriodFilter.lastSevenDays();
      await useCase.execute({ period });
      expect(mockRepo.sumRevenueInPeriod).toHaveBeenCalledWith(period.from, period.to);
    });

    it('deve chamar sumCostInPeriod com as datas do período', async () => {
      const period = PeriodFilter.today();
      await useCase.execute({ period });
      expect(mockRepo.sumCostInPeriod).toHaveBeenCalledWith(period.from, period.to);
    });

    it('deve chamar countNewOrdersByOriginInPeriod com as datas do período', async () => {
      const period = PeriodFilter.custom(new Date('2024-01-01'), new Date('2024-01-31'));
      await useCase.execute({ period });
      expect(mockRepo.countNewOrdersByOriginInPeriod).toHaveBeenCalledWith(period.from, period.to);
    });

    it('deve chamar countOpenOrders sem argumentos de período (real-time)', async () => {
      await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(mockRepo.countOpenOrders).toHaveBeenCalledWith();
    });
  });

  describe('Casos de borda', () => {
    it('deve retornar grossMarginPercent = 0 quando revenue é zero', async () => {
      mockRepo.sumRevenueInPeriod.mockResolvedValue(0);
      mockRepo.sumCostInPeriod.mockResolvedValue(0);
      const result = await useCase.execute({ period: PeriodFilter.today() });
      expect(result.grossMarginPercent).toBe(0);
    });

    it('deve retornar topCustomer nulo quando repositório retorna null', async () => {
      mockRepo.getTopCustomerInPeriod.mockResolvedValue(null);
      const result = await useCase.execute({ period: PeriodFilter.today() });
      expect(result.topCustomer).toBeNull();
    });

    it('deve incluir as datas do período no resultado', async () => {
      const period = PeriodFilter.thisMonth();
      const result = await useCase.execute({ period });
      expect(result.period).toEqual({ from: period.from, to: period.to });
    });
  });
});
