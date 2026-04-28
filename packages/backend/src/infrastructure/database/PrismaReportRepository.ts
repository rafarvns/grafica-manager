import { PrismaClient } from '@prisma/client';
import { ReportFilter, ReportGrouping } from '@/domain/value-objects/ReportFilter';
import { RawReportRow } from '@/application/dtos/ReportDTO';
import { IReportQueryRepository } from '@/application/use-cases/GenerateReportUseCase';
import { IReportStreamRepository } from '@/application/use-cases/ExportReportUseCase';
import { ReportRow } from '@/application/dtos/ReportDTO';
import { MarginCalculator } from '@/domain/services/MarginCalculator';

type GroupedOrder = {
  customerId: string | null;
  storeId: string | null;
  _sum: { salePrice: number | null };
  _count: { id: number };
};

function buildWhereClause(filter: ReportFilter) {
  return {
    createdAt: { gte: filter.period.from, lte: filter.period.to },
    deletedAt: null,
    ...(filter.customerId ? { customerId: filter.customerId } : {}),
    ...(filter.origin ? { store: { source: filter.origin as never } } : {}),
  };
}

async function fetchPrintCountForOrders(
  prisma: PrismaClient,
  orderIds: string[],
  filter: ReportFilter
): Promise<Map<string, number>> {
  if (orderIds.length === 0) return new Map();
  const jobs = await prisma.printJob.groupBy({
    by: ['orderId'],
    _count: { id: true },
    where: {
      orderId: { in: orderIds },
      printedAt: { gte: filter.period.from, lte: filter.period.to },
    },
  });
  const map = new Map<string, number>();
  for (const j of jobs) {
    if (j.orderId) map.set(j.orderId, j._count.id);
  }
  return map;
}

async function fetchTotalPrintCostForOrders(
  prisma: PrismaClient,
  orderIds: string[],
  filter: ReportFilter
): Promise<Map<string, number>> {
  if (orderIds.length === 0) return new Map();
  const jobs = await prisma.printJob.groupBy({
    by: ['orderId'],
    _sum: { registeredCost: true },
    where: {
      orderId: { in: orderIds },
      printedAt: { gte: filter.period.from, lte: filter.period.to },
    },
  });
  const map = new Map<string, number>();
  for (const j of jobs) {
    if (j.orderId) map.set(j.orderId, Number(j._sum.registeredCost ?? 0));
  }
  return map;
}

export class PrismaReportRepository implements IReportQueryRepository, IReportStreamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async queryReportRows(filter: ReportFilter): Promise<{ rows: RawReportRow[]; total: number }> {
    const where = buildWhereClause(filter);

    if (filter.grouping === ReportGrouping.CLIENT) {
      return this.queryGroupedByClient(filter, where);
    }

    if (filter.grouping === ReportGrouping.ORIGIN) {
      return this.queryGroupedByOrigin(filter, where);
    }

    return this.queryFlat(filter, where);
  }

  private async queryFlat(
    filter: ReportFilter,
    where: object
  ): Promise<{ rows: RawReportRow[]; total: number }> {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          salePrice: true,
          customer: { select: { name: true } },
          store: { select: { source: true } },
        },
        orderBy: this.buildOrderBy(filter),
        skip: filter.getOffset(),
        take: filter.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    const orderIds = orders.map((o) => o.id);
    const [printCounts, printCosts] = await Promise.all([
      fetchPrintCountForOrders(this.prisma, orderIds, filter),
      fetchTotalPrintCostForOrders(this.prisma, orderIds, filter),
    ]);

    const rows: RawReportRow[] = orders.map((o) => ({
      label: o.orderNumber,
      printCount: printCounts.get(o.id) ?? 0,
      revenue: Number(o.salePrice),
      cost: printCosts.get(o.id) ?? 0,
    }));

    return { rows, total };
  }

  private async queryGroupedByClient(
    filter: ReportFilter,
    where: object
  ): Promise<{ rows: RawReportRow[]; total: number }> {
    const grouped = await this.prisma.order.groupBy({
      by: ['customerId'],
      _sum: { salePrice: true },
      _count: { id: true },
      where,
      orderBy: { _sum: { salePrice: 'desc' } },
    });

    const total = grouped.length;
    const page = grouped.slice(filter.getOffset(), filter.getOffset() + filter.pageSize);

    const rows = await Promise.all(
      page.map(async (g) => {
        const customer = g.customerId
          ? await this.prisma.customer.findUnique({
              where: { id: g.customerId },
              select: { name: true },
            })
          : null;

        const orderIds = await this.prisma.order
          .findMany({ where: { ...where, customerId: g.customerId }, select: { id: true } })
          .then((list) => list.map((o) => o.id));

        const [printCounts, printCosts] = await Promise.all([
          fetchPrintCountForOrders(this.prisma, orderIds, filter),
          fetchTotalPrintCostForOrders(this.prisma, orderIds, filter),
        ]);

        const printCount = [...printCounts.values()].reduce((a, b) => a + b, 0);
        const cost = [...printCosts.values()].reduce((a, b) => a + b, 0);

        return {
          label: customer?.name ?? 'Sem cliente',
          printCount,
          revenue: Number(g._sum.salePrice ?? 0),
          cost,
        };
      })
    );

    return { rows, total };
  }

  private async queryGroupedByOrigin(
    filter: ReportFilter,
    where: object
  ): Promise<{ rows: RawReportRow[]; total: number }> {
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        salePrice: true,
        store: { select: { source: true } },
      },
    });

    const byOrigin = new Map<string, { revenue: number; orderIds: string[] }>();
    for (const o of orders) {
      const key = o.store?.source ?? 'MANUAL';
      const existing = byOrigin.get(key) ?? { revenue: 0, orderIds: [] };
      existing.revenue += Number(o.salePrice);
      existing.orderIds.push(o.id);
      byOrigin.set(key, existing);
    }

    const total = byOrigin.size;
    const entries = [...byOrigin.entries()].slice(filter.getOffset(), filter.getOffset() + filter.pageSize);

    const rows = await Promise.all(
      entries.map(async ([origin, data]) => {
        const [printCounts, printCosts] = await Promise.all([
          fetchPrintCountForOrders(this.prisma, data.orderIds, filter),
          fetchTotalPrintCostForOrders(this.prisma, data.orderIds, filter),
        ]);
        const printCount = [...printCounts.values()].reduce((a, b) => a + b, 0);
        const cost = [...printCosts.values()].reduce((a, b) => a + b, 0);
        return { label: origin, printCount, revenue: data.revenue, cost };
      })
    );

    return { rows, total };
  }

  private buildOrderBy(filter: ReportFilter): object {
    if (!filter.sortColumn) return { createdAt: 'desc' };
    const dir = filter.sortDirection === 'DESC' ? 'desc' : 'asc';
    if (filter.sortColumn === 'revenue') return { salePrice: dir };
    return { createdAt: dir };
  }

  async *streamReportRows(filter: ReportFilter): AsyncIterable<ReportRow> {
    const batchSize = 100;
    let page = 1;
    while (true) {
      const streamFilter = ReportFilter.create({
        period: filter.period,
        grouping: filter.grouping,
        sortDirection: filter.sortDirection,
        page,
        pageSize: 100,
        ...(filter.customerId !== undefined ? { customerId: filter.customerId } : {}),
        ...(filter.origin !== undefined ? { origin: filter.origin } : {}),
        ...(filter.paperTypeId !== undefined ? { paperTypeId: filter.paperTypeId } : {}),
        ...(filter.sortColumn !== undefined ? { sortColumn: filter.sortColumn } : {}),
      });
      const { rows: rawRows } = await this.queryReportRows(streamFilter);
      if (rawRows.length === 0) break;
      for (const r of rawRows) {
        yield {
          ...r,
          grossMarginPercent: MarginCalculator.grossMarginPercent(r.revenue, r.cost),
          netMarginPercent: MarginCalculator.netMarginPercent(r.revenue, r.cost),
        };
      }
      if (rawRows.length < batchSize) break;
      page++;
    }
  }
}
