import { describe, it, expect } from 'vitest';
import { DashboardMetrics } from '@/domain/value-objects/DashboardMetrics';

const basePeriod = { from: new Date('2024-01-01'), to: new Date('2024-01-31') };

const baseInput = {
  printsTodayCount: 50,
  openOrdersCount: 12,
  revenue: 10000,
  cost: 3000,
  newOrders: { total: 20, byOrigin: { SHOPEE: 15, MANUAL: 5 } },
  topCustomer: { name: 'Cliente A', revenue: 3000 },
  period: basePeriod,
};

describe('DashboardMetrics', () => {
  describe('Criação com valores válidos', () => {
    it('deve armazenar todos os KPIs corretamente', () => {
      const metrics = DashboardMetrics.create(baseInput);
      expect(metrics.printsTodayCount).toBe(50);
      expect(metrics.openOrdersCount).toBe(12);
      expect(metrics.revenue).toBe(10000);
      expect(metrics.cost).toBe(3000);
    });

    it('deve calcular grossMarginPercent = 70 para receita 10000 e custo 3000', () => {
      const metrics = DashboardMetrics.create(baseInput);
      expect(metrics.grossMarginPercent).toBe(70);
    });

    it('deve retornar grossMarginPercent = 0 quando receita é zero', () => {
      const metrics = DashboardMetrics.create({ ...baseInput, revenue: 0, cost: 0 });
      expect(metrics.grossMarginPercent).toBe(0);
    });

    it('deve calcular margem negativa quando custo supera receita', () => {
      const metrics = DashboardMetrics.create({ ...baseInput, revenue: 1000, cost: 1500 });
      expect(metrics.grossMarginPercent).toBe(-50);
    });

    it('deve calcular margem de 100% quando custo é zero', () => {
      const metrics = DashboardMetrics.create({ ...baseInput, revenue: 5000, cost: 0 });
      expect(metrics.grossMarginPercent).toBe(100);
    });

    it('deve aceitar topCustomer nulo', () => {
      const metrics = DashboardMetrics.create({ ...baseInput, topCustomer: null });
      expect(metrics.topCustomer).toBeNull();
    });

    it('deve armazenar o período corretamente', () => {
      const metrics = DashboardMetrics.create(baseInput);
      expect(metrics.period).toEqual(basePeriod);
    });
  });

  describe('KPI: novos pedidos por origem', () => {
    it('deve armazenar total e distribuição por origem', () => {
      const metrics = DashboardMetrics.create(baseInput);
      expect(metrics.newOrders.total).toBe(20);
      expect(metrics.newOrders.byOrigin['SHOPEE']).toBe(15);
      expect(metrics.newOrders.byOrigin['MANUAL']).toBe(5);
    });

    it('deve aceitar byOrigin vazio', () => {
      const metrics = DashboardMetrics.create({
        ...baseInput,
        newOrders: { total: 0, byOrigin: {} },
      });
      expect(metrics.newOrders.total).toBe(0);
    });
  });

  describe('KPI: cliente top', () => {
    it('deve armazenar nome e receita do cliente topo', () => {
      const metrics = DashboardMetrics.create(baseInput);
      expect(metrics.topCustomer?.name).toBe('Cliente A');
      expect(metrics.topCustomer?.revenue).toBe(3000);
    });
  });

  describe('Validação de valores negativos', () => {
    it('deve lançar erro quando printsTodayCount for negativo', () => {
      expect(() =>
        DashboardMetrics.create({ ...baseInput, printsTodayCount: -1 })
      ).toThrow();
    });

    it('deve lançar erro quando openOrdersCount for negativo', () => {
      expect(() =>
        DashboardMetrics.create({ ...baseInput, openOrdersCount: -1 })
      ).toThrow();
    });

    it('deve lançar erro quando revenue for negativo', () => {
      expect(() =>
        DashboardMetrics.create({ ...baseInput, revenue: -100 })
      ).toThrow();
    });

    it('deve lançar erro quando cost for negativo', () => {
      expect(() =>
        DashboardMetrics.create({ ...baseInput, cost: -100 })
      ).toThrow();
    });
  });

  describe('Casos de borda', () => {
    it('deve aceitar todos os valores zerados', () => {
      const metrics = DashboardMetrics.create({
        ...baseInput,
        printsTodayCount: 0,
        openOrdersCount: 0,
        revenue: 0,
        cost: 0,
        newOrders: { total: 0, byOrigin: {} },
        topCustomer: null,
      });
      expect(metrics.grossMarginPercent).toBe(0);
    });
  });
});
