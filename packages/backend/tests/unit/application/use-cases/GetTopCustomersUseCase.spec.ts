import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetTopCustomersUseCase } from '@/application/use-cases/GetTopCustomersUseCase';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

describe('GetTopCustomersUseCase', () => {
  let mockRepo: any;
  let useCase: GetTopCustomersUseCase;

  const mockData = [
    { customerId: 'c1', name: 'Cliente A', revenue: 5000, orderCount: 10 },
    { customerId: 'c2', name: 'Cliente B', revenue: 3000, orderCount: 7 },
    { customerId: 'c3', name: 'Cliente C', revenue: 2000, orderCount: 5 },
    { customerId: 'c4', name: 'Cliente D', revenue: 1000, orderCount: 3 },
    { customerId: 'c5', name: 'Cliente E', revenue: 500, orderCount: 1 },
  ];

  beforeEach(() => {
    mockRepo = {
      getTopCustomersByRevenue: vi.fn().mockResolvedValue(mockData),
    };
    useCase = new GetTopCustomersUseCase(mockRepo);
  });

  describe('Retorno dos clientes', () => {
    it('deve retornar top 5 clientes por padrão', async () => {
      const period = PeriodFilter.thisMonth();
      const result = await useCase.execute({ period });
      expect(result).toHaveLength(5);
    });

    it('deve chamar repositório com limit=5 por padrão', async () => {
      const period = PeriodFilter.thisMonth();
      await useCase.execute({ period });
      expect(mockRepo.getTopCustomersByRevenue).toHaveBeenCalledWith(
        period.from,
        period.to,
        5
      );
    });

    it('deve respeitar limit customizado', async () => {
      mockRepo.getTopCustomersByRevenue.mockResolvedValue(mockData.slice(0, 3));
      const period = PeriodFilter.thisMonth();
      const result = await useCase.execute({ period, limit: 3 });
      expect(mockRepo.getTopCustomersByRevenue).toHaveBeenCalledWith(
        period.from,
        period.to,
        3
      );
      expect(result).toHaveLength(3);
    });
  });

  describe('Estrutura do resultado', () => {
    it('deve incluir customerId no resultado', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result[0]).toHaveProperty('customerId');
    });

    it('deve incluir name no resultado', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result[0]).toHaveProperty('name');
    });

    it('deve incluir revenue no resultado', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result[0]).toHaveProperty('revenue');
    });

    it('deve incluir orderCount no resultado', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result[0]).toHaveProperty('orderCount');
    });

    it('deve retornar clientes em ordem decrescente de receita', async () => {
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result[0].revenue).toBeGreaterThan(result[1].revenue);
      expect(result[1].revenue).toBeGreaterThan(result[2].revenue);
    });
  });

  describe('Casos de borda', () => {
    it('deve retornar array vazio quando não há clientes', async () => {
      mockRepo.getTopCustomersByRevenue.mockResolvedValue([]);
      const result = await useCase.execute({ period: PeriodFilter.thisMonth() });
      expect(result).toEqual([]);
    });

    it('deve chamar repositório com as datas corretas do período', async () => {
      const period = PeriodFilter.custom(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      await useCase.execute({ period });
      expect(mockRepo.getTopCustomersByRevenue).toHaveBeenCalledWith(
        period.from,
        period.to,
        5
      );
    });
  });
});
