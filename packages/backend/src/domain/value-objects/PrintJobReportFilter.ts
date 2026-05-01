import { PeriodFilter } from './PeriodFilter';
import type { PrintJobReportGrouping } from '@grafica/shared';

const VALID_PAGE_SIZES = [25, 50, 100] as const;
type PageSize = (typeof VALID_PAGE_SIZES)[number];

interface PrintJobReportFilterParams {
  period: PeriodFilter;
  paperTypeIds?: string[];
  colorProfiles?: ('CMYK' | 'RGB' | 'GRAYSCALE')[];
  qualities?: ('DRAFT' | 'NORMAL' | 'HIGH')[];
  printerIds?: string[];
  statuses?: ('success' | 'error' | 'cancelled')[];
  grouping?: PrintJobReportGrouping;
  page?: number;
  pageSize?: PageSize;
}

export class PrintJobReportFilter {
  readonly period: PeriodFilter;
  readonly paperTypeIds?: string[];
  readonly colorProfiles?: ('CMYK' | 'RGB' | 'GRAYSCALE')[];
  readonly qualities?: ('DRAFT' | 'NORMAL' | 'HIGH')[];
  readonly printerIds?: string[];
  readonly statuses?: ('success' | 'error' | 'cancelled')[];
  readonly grouping: PrintJobReportGrouping;
  readonly page: number;
  readonly pageSize: PageSize;

  private constructor(params: PrintJobReportFilterParams) {
    this.period = params.period;
    if (params.paperTypeIds) this.paperTypeIds = params.paperTypeIds;
    if (params.colorProfiles) this.colorProfiles = params.colorProfiles;
    if (params.qualities) this.qualities = params.qualities;
    if (params.printerIds) this.printerIds = params.printerIds;
    if (params.statuses) this.statuses = params.statuses;
    this.grouping = params.grouping ?? 'none';
    this.page = params.page ?? 1;
    this.pageSize = params.pageSize ?? 25;
  }

  static fromQueryParams(query: Record<string, unknown>): PrintJobReportFilter {
    const { startDate, endDate } = query;
    if (!startDate || !endDate) {
      throw new Error('Período é obrigatório');
    }

    const period = PeriodFilter.custom(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const diffTime = Math.abs(period.to.getTime() - period.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      throw new Error('Período não pode exceder 1 ano');
    }

    const parseArray = (val: unknown): string[] | undefined => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === 'string') return val.split(',');
      return undefined;
    };

    const rawPageSize = query['pageSize'] ? Number(query['pageSize']) : 25;
    const pageSize: PageSize = (VALID_PAGE_SIZES as readonly number[]).includes(rawPageSize)
      ? (rawPageSize as PageSize)
      : 25;

    const params: PrintJobReportFilterParams = {
      period,
      grouping: (query['grouping'] as PrintJobReportGrouping) ?? 'none',
      page: query['page'] ? Number(query['page']) : 1,
      pageSize,
    };

    const paperTypeIds = parseArray(query['paperTypeIds']);
    if (paperTypeIds) params.paperTypeIds = paperTypeIds;

    const colorProfiles = parseArray(query['colorProfiles']);
    if (colorProfiles) params.colorProfiles = colorProfiles as ('CMYK' | 'RGB' | 'GRAYSCALE')[];

    const qualities = parseArray(query['qualities']);
    if (qualities) params.qualities = qualities as ('DRAFT' | 'NORMAL' | 'HIGH')[];

    const printerIds = parseArray(query['printerIds']);
    if (printerIds) params.printerIds = printerIds;

    const statuses = parseArray(query['statuses']);
    if (statuses) params.statuses = statuses as ('success' | 'error' | 'cancelled')[];

    return new PrintJobReportFilter(params);
  }

  getOffset(): number {
    return (this.page - 1) * this.pageSize;
  }
}
