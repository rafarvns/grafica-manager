import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { ReportResult, ReportRow, ReportTotals } from '@grafica/shared';

export interface IReportQueryRepository {
  queryReportRows(filter: ReportFilter): Promise<{ rows: ReportRow[]; totalCount: number }>;
}

export class GenerateReportUseCase {
  constructor(private readonly repo: IReportQueryRepository) {}

  async execute(input: { filter: ReportFilter }): Promise<ReportResult> {
    const { filter } = input;
    const { rows, totalCount } = await this.repo.queryReportRows(filter);

    const totals = this.calculateTotals(rows);

    return {
      rows,
      totals,
      pagination: {
        page: filter.page,
        pageSize: filter.pageSize,
        totalCount,
      },
    };
  }

  private calculateTotals(rows: ReportRow[]): ReportTotals {
    const totals = rows.reduce(
      (acc, row) => {
        acc.totalQuantity += row.quantity;
        acc.totalCost += row.cost;
        acc.totalRevenue += row.salePrice;
        acc.totalMargin += row.margin;
        return acc;
      },
      {
        totalOrders: rows.length,
        totalQuantity: 0,
        totalCost: 0,
        totalRevenue: 0,
        totalMargin: 0,
        marginPercent: 0,
        ticketAverage: 0,
      }
    );

    if (totals.totalRevenue > 0) {
      totals.marginPercent = (totals.totalMargin / totals.totalRevenue) * 100;
    }

    if (totals.totalOrders > 0) {
      totals.ticketAverage = totals.totalRevenue / totals.totalOrders;
    }

    return totals;
  }
}
