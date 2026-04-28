import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';
import { GetDashboardMetricsUseCase } from '@/application/use-cases/GetDashboardMetricsUseCase';
import { GetTopCustomersUseCase } from '@/application/use-cases/GetTopCustomersUseCase';
import { GetCostAnalysisUseCase } from '@/application/use-cases/GetCostAnalysisUseCase';
import { NewOrders, TopCustomer } from '@/domain/value-objects/DashboardMetrics';
import { TopCustomerEntry, PrintTrendEntry } from '@/application/dtos/MetricsDTO';

function parsePeriod(query: Record<string, unknown>): PeriodFilter {
  const { preset, from, to } = query;
  if (preset === 'today') return PeriodFilter.today();
  if (preset === 'thisWeek') return PeriodFilter.thisWeek();
  if (preset === 'lastSevenDays') return PeriodFilter.lastSevenDays();
  if (from && to) {
    return PeriodFilter.custom(new Date(from as string), new Date(to as string));
  }
  return PeriodFilter.thisMonth();
}

function buildMetricsRepository(prisma: PrismaClient) {
  return {
    async countPrintJobsInPeriod(from: Date, to: Date): Promise<number> {
      return prisma.printJob.count({
        where: { printedAt: { gte: from, lte: to }, status: 'success' },
      });
    },

    async countOpenOrders(): Promise<number> {
      return prisma.order.count({
        where: {
          status: { in: ['draft', 'scheduled', 'in_production'] },
          deletedAt: null,
        },
      });
    },

    async sumRevenueInPeriod(from: Date, to: Date): Promise<number> {
      const result = await prisma.order.aggregate({
        _sum: { salePrice: true },
        where: { createdAt: { gte: from, lte: to }, deletedAt: null },
      });
      return Number(result._sum.salePrice ?? 0);
    },

    async sumCostInPeriod(from: Date, to: Date): Promise<number> {
      const result = await prisma.printJob.aggregate({
        _sum: { registeredCost: true },
        where: { createdAt: { gte: from, lte: to } },
      });
      return Number(result._sum.registeredCost ?? 0);
    },

    async countNewOrdersByOriginInPeriod(from: Date, to: Date): Promise<NewOrders> {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to }, deletedAt: null },
        select: { store: { select: { source: true } } },
      });
      const byOrigin: Record<string, number> = {};
      for (const order of orders) {
        const origin = order.store?.source ?? 'MANUAL';
        byOrigin[origin] = (byOrigin[origin] ?? 0) + 1;
      }
      return { total: orders.length, byOrigin };
    },

    async getTopCustomerInPeriod(from: Date, to: Date): Promise<TopCustomer | null> {
      const result = await prisma.order.groupBy({
        by: ['customerId'],
        _sum: { salePrice: true },
        where: { createdAt: { gte: from, lte: to }, deletedAt: null, customerId: { not: null } },
        orderBy: { _sum: { salePrice: 'desc' } },
        take: 1,
      });
      if (!result[0]?.customerId) return null;
      const customer = await prisma.customer.findUnique({
        where: { id: result[0].customerId },
        select: { name: true },
      });
      if (!customer) return null;
      return { name: customer.name, revenue: Number(result[0]._sum.salePrice ?? 0) };
    },

    async getTopCustomersByRevenue(from: Date, to: Date, limit: number): Promise<TopCustomerEntry[]> {
      const grouped = await prisma.order.groupBy({
        by: ['customerId'],
        _sum: { salePrice: true },
        _count: { id: true },
        where: { createdAt: { gte: from, lte: to }, deletedAt: null, customerId: { not: null } },
        orderBy: { _sum: { salePrice: 'desc' } },
        take: limit,
      });
      const entries = await Promise.all(
        grouped.map(async (g) => {
          const customer = await prisma.customer.findUnique({
            where: { id: g.customerId! },
            select: { id: true, name: true },
          });
          return {
            customerId: customer?.id ?? g.customerId!,
            name: customer?.name ?? 'Desconhecido',
            revenue: Number(g._sum.salePrice ?? 0),
            orderCount: g._count.id,
          };
        })
      );
      return entries;
    },

    async getPrintTrendsInPeriod(from: Date, to: Date): Promise<PrintTrendEntry[]> {
      const jobs = await prisma.printJob.findMany({
        where: { printedAt: { gte: from, lte: to }, status: 'success' },
        select: { printedAt: true },
      });
      const byDate: Record<string, number> = {};
      for (const job of jobs) {
        const key = job.printedAt.toISOString().split('T')[0] ?? '';
        if (key) byDate[key] = (byDate[key] ?? 0) + 1;
      }
      return Object.entries(byDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  };
}

export function createMetricsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const repo = buildMetricsRepository(prisma);
      const [metrics, topCustomers, costAnalysis, printTrends] = await Promise.all([
        new GetDashboardMetricsUseCase(repo).execute({ period }),
        new GetTopCustomersUseCase(repo).execute({ period }),
        new GetCostAnalysisUseCase(repo).execute({ period }),
        repo.getPrintTrendsInPeriod(period.from, period.to),
      ]);
      res.json({ data: { metrics, topCustomers, costAnalysis, printTrends } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/kpis', async (req: Request, res: Response) => {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const repo = buildMetricsRepository(prisma);
      const metrics = await new GetDashboardMetricsUseCase(repo).execute({ period });
      res.json({ data: metrics });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/top-customers', async (req: Request, res: Response) => {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const repo = buildMetricsRepository(prisma);
      const result = await new GetTopCustomersUseCase(repo).execute({ period, limit });
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/cost-analysis', async (req: Request, res: Response) => {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const repo = buildMetricsRepository(prisma);
      const result = await new GetCostAnalysisUseCase(repo).execute({ period });
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/print-trends', async (req: Request, res: Response) => {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const repo = buildMetricsRepository(prisma);
      const result = await repo.getPrintTrendsInPeriod(period.from, period.to);
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/order-origin', async (req: Request, res: Response) => {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const repo = buildMetricsRepository(prisma);
      const result = await repo.countNewOrdersByOriginInPeriod(period.from, period.to);
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  return router;
}
