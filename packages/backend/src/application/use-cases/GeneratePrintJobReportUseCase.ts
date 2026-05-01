import type {
  PrintJobReportResult,
  PrintJobReportRow,
  PrintJobReportTotals,
  PrintJobReportGroupedRow,
  PrintJobReportGrouping,
} from '@grafica/shared';
import { PrintJobReportFilter } from '@/domain/value-objects/PrintJobReportFilter';

export interface IPrintJobReportRepository {
  queryRows(filter: PrintJobReportFilter): Promise<{ rows: PrintJobReportRow[]; totalCount: number }>;
  queryAllRows(filter: PrintJobReportFilter): Promise<PrintJobReportRow[]>;
}

export class GeneratePrintJobReportUseCase {
  constructor(private readonly repo: IPrintJobReportRepository) {}

  async execute(input: { filter: PrintJobReportFilter }): Promise<PrintJobReportResult> {
    const { filter } = input;

    let rows: PrintJobReportRow[];
    let totalCount: number;

    if (filter.grouping !== 'none') {
      rows = await this.repo.queryAllRows(filter);
      totalCount = rows.length;
    } else {
      const result = await this.repo.queryRows(filter);
      rows = result.rows;
      totalCount = result.totalCount;
    }

    const totals = this.calculateTotals(rows);
    const grouped =
      filter.grouping !== 'none'
        ? this.calculateGrouped(rows, filter.grouping, totals.totalJobs)
        : [];

    return {
      rows: filter.grouping === 'none' ? rows : [],
      grouped,
      totals,
      pagination: {
        page: filter.page,
        pageSize: filter.pageSize,
        totalCount,
      },
    };
  }

  private calculateTotals(rows: PrintJobReportRow[]): PrintJobReportTotals {
    const successRows = rows.filter((r) => r.status === 'success');
    const totalJobs = rows.length;
    const successfulJobs = successRows.length;
    const totalPagesBlackAndWhite = rows.reduce((s, r) => s + r.pagesBlackAndWhite, 0);
    const totalPagesColor = rows.reduce((s, r) => s + r.pagesColor, 0);
    const totalPages = totalPagesBlackAndWhite + totalPagesColor;
    const totalCost = successRows.reduce((s, r) => s + r.registeredCost, 0);

    return {
      totalJobs,
      successfulJobs,
      failedJobs: totalJobs - successfulJobs,
      successRate: totalJobs > 0 ? (successfulJobs / totalJobs) * 100 : 0,
      totalPages,
      totalPagesBlackAndWhite,
      totalPagesColor,
      totalCost,
      averageCostPerJob: successfulJobs > 0 ? totalCost / successfulJobs : 0,
      averageCostPerPage: totalPages > 0 ? totalCost / totalPages : 0,
    };
  }

  private calculateGrouped(
    rows: PrintJobReportRow[],
    grouping: PrintJobReportGrouping,
    totalJobs: number
  ): PrintJobReportGroupedRow[] {
    const getKey = (row: PrintJobReportRow): string => {
      switch (grouping) {
        case 'paper': return row.paperTypeName;
        case 'color': return row.colorProfile;
        case 'quality': return row.quality;
        case 'printer': return row.printerName;
        case 'status': return row.status;
        default: return 'all';
      }
    };

    const getLabel = (key: string): string => {
      if (grouping === 'color') {
        const map: Record<string, string> = { GRAYSCALE: 'P&B', CMYK: 'CMYK', RGB: 'RGB' };
        return map[key] ?? key;
      }
      if (grouping === 'quality') {
        const map: Record<string, string> = { DRAFT: 'Rascunho', NORMAL: 'Normal', HIGH: 'Alta' };
        return map[key] ?? key;
      }
      if (grouping === 'status') {
        const map: Record<string, string> = { success: 'Sucesso', error: 'Erro', cancelled: 'Cancelada' };
        return map[key] ?? key;
      }
      return key;
    };

    const groups = new Map<string, PrintJobReportRow[]>();
    for (const row of rows) {
      const key = getKey(row);
      const existing = groups.get(key);
      if (existing) {
        existing.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    return Array.from(groups.entries())
      .map(([key, groupRows]) => {
        const successRows = groupRows.filter((r) => r.status === 'success');
        const jobCount = groupRows.length;
        const totalPagesBlackAndWhite = groupRows.reduce((s, r) => s + r.pagesBlackAndWhite, 0);
        const totalPagesColor = groupRows.reduce((s, r) => s + r.pagesColor, 0);
        const totalPages = totalPagesBlackAndWhite + totalPagesColor;
        const totalCost = successRows.reduce((s, r) => s + r.registeredCost, 0);

        return {
          groupKey: key,
          groupLabel: getLabel(key),
          jobCount,
          totalPages,
          totalPagesBlackAndWhite,
          totalPagesColor,
          totalCost,
          averageCostPerJob: successRows.length > 0 ? totalCost / successRows.length : 0,
          averageCostPerPage: totalPages > 0 ? totalCost / totalPages : 0,
          successRate: jobCount > 0 ? (successRows.length / jobCount) * 100 : 0,
          sharePercent: totalJobs > 0 ? (jobCount / totalJobs) * 100 : 0,
        };
      })
      .sort((a, b) => b.jobCount - a.jobCount);
  }
}
