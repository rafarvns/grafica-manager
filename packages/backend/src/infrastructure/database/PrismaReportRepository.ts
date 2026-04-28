import { PrismaClient } from '@prisma/client';
import { ReportFilter, ReportGrouping } from '@/domain/value-objects/ReportFilter';
import { IReportQueryRepository } from '@/application/use-cases/GenerateReportUseCase';
import { IReportStreamRepository } from '@/application/use-cases/ExportReportUseCase';
import { ReportRow } from '@grafica/shared';

export class PrismaReportRepository implements IReportQueryRepository, IReportStreamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async queryReportRows(filter: ReportFilter): Promise<{ rows: ReportRow[]; totalCount: number }> {
    const where = this.buildWhereClause(filter);

    // No momento, focando na listagem flat para alinhar com o frontend
    // O agrupamento pode ser implementado conforme a necessidade
    if (filter.grouping === ReportGrouping.NONE || filter.grouping === ReportGrouping.ORDER) {
      return this.queryFlat(filter, where);
    }

    // Outros agrupamentos (CUSTOMER, PAPER, ORIGIN) seriam implementados aqui
    // Por enquanto, retornamos o flat para não quebrar a UI
    return this.queryFlat(filter, where);
  }

  private async queryFlat(
    filter: ReportFilter,
    where: any
  ): Promise<{ rows: ReportRow[]; totalCount: number }> {
    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          store: true,
          printJobs: {
            include: {
              paper: true,
            },
          },
        },
        orderBy: this.buildOrderBy(filter),
        skip: filter.getOffset(),
        take: filter.pageSize,
      }) as Promise<any[]>,
      this.prisma.order.count({ where }),
    ]);

    const rows: ReportRow[] = orders.map((o: any) => {
      const quantity = o.printJobs?.reduce((acc: number, job: any) => acc + (job.pagesColor + job.pagesBlackAndWhite), 0) ?? 0;
      const cost = o.printJobs?.reduce((acc: number, job: any) => acc + Number(job.registeredCost ?? 0), 0) ?? 0;
      const salePrice = Number(o.salePrice);
      const margin = salePrice - cost;
      const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId || undefined,
        customerName: o.customer?.name ?? 'Cliente Avulso',
        paperType: o.printJobs?.[0]?.paper?.name ?? 'N/A',
        quantity,
        salePrice,
        cost,
        margin,
        marginPercent,
        date: o.createdAt.toISOString(),
        origin: (o.store?.source as 'SHOPEE' | 'MANUAL') ?? 'MANUAL',
      };
    });

    return { rows, totalCount };
  }

  private buildWhereClause(filter: ReportFilter): any {
    const where: any = {
      createdAt: {
        gte: filter.period.from,
        lte: filter.period.to,
      },
      deletedAt: null,
    };

    if (filter.customerIds && filter.customerIds.length > 0) {
      where.customerId = { in: filter.customerIds };
    }

    if (filter.origin && filter.origin.length > 0) {
      where.store = { source: { in: filter.origin } };
    }

    if (filter.statuses && filter.statuses.length > 0) {
      where.status = { in: filter.statuses };
    }

    if (filter.paperTypeIds && filter.paperTypeIds.length > 0) {
      where.printJobs = {
        some: {
          paperTypeId: { in: filter.paperTypeIds },
        },
      };
    }

    return where;
  }

  private buildOrderBy(filter: ReportFilter): any {
    if (!filter.sortColumn) return { createdAt: 'desc' };
    const dir = filter.sortDirection.toLowerCase() as 'asc' | 'desc';
    
    switch (filter.sortColumn) {
      case 'salePrice':
        return { salePrice: dir };
      case 'orderNumber':
        return { orderNumber: dir };
      case 'date':
        return { createdAt: dir };
      default:
        return { createdAt: 'desc' };
    }
  }

  async *streamReportRows(filter: ReportFilter): AsyncIterable<ReportRow> {
    let page = 1;
    const pageSize = 100;

    while (true) {
      const streamFilter = ReportFilter.create({
        ...filter,
        page,
        pageSize,
      });

      const { rows } = await this.queryReportRows(streamFilter);
      if (rows.length === 0) break;

      for (const row of rows) {
        yield row;
      }

      if (rows.length < pageSize) break;
      page++;
    }
  }
}
