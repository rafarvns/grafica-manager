import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { MarginCalculator } from '@/domain/services/MarginCalculator';
import { RawReportRow, ReportResult, ReportRow } from '@/application/dtos/ReportDTO';

export interface IReportQueryRepository {
  queryReportRows(filter: ReportFilter): Promise<{ rows: RawReportRow[]; total: number }>;
}

export class GenerateReportUseCase {
  constructor(private readonly repo: IReportQueryRepository) {}

  async execute(input: { filter: ReportFilter }): Promise<ReportResult> {
    const { filter } = input;
    const { rows: rawRows, total } = await this.repo.queryReportRows(filter);

    const rows: ReportRow[] = rawRows.map((r) => ({
      ...r,
      grossMarginPercent: MarginCalculator.grossMarginPercent(r.revenue, r.cost),
      netMarginPercent: MarginCalculator.netMarginPercent(r.revenue, r.cost),
    }));

    const totalPages = total === 0 ? 0 : Math.ceil(total / filter.pageSize);

    return {
      rows,
      total,
      page: filter.page,
      pageSize: filter.pageSize,
      totalPages,
    };
  }
}
