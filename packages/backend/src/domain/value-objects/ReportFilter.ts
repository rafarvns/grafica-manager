import { PeriodFilter } from './PeriodFilter';
import { OrderStatus } from '@grafica/shared';

export enum ReportGrouping {
  NONE = 'none',
  CUSTOMER = 'customer',
  ORDER = 'order',
  PAPER = 'paper',
  ORIGIN = 'origin',
}

export type SortDirection = 'ASC' | 'DESC';

const VALID_PAGE_SIZES = [25, 50, 100] as const;
type PageSize = (typeof VALID_PAGE_SIZES)[number];

export interface ReportFilterParams {
  period: PeriodFilter;
  customerIds?: string[] | undefined;
  paperTypeIds?: string[] | undefined;
  origin?: ('SHOPEE' | 'MANUAL')[] | undefined;
  statuses?: OrderStatus[] | undefined;
  grouping?: ReportGrouping | undefined;
  sortColumn?: string | undefined;
  sortDirection?: SortDirection | undefined;
  page?: number | undefined;
  pageSize?: PageSize | undefined;
}

export class ReportFilter {
  readonly period: PeriodFilter;
  readonly customerIds?: string[] | undefined;
  readonly paperTypeIds?: string[] | undefined;
  readonly origin?: ('SHOPEE' | 'MANUAL')[] | undefined;
  readonly statuses?: OrderStatus[] | undefined;
  readonly grouping: ReportGrouping;
  readonly sortColumn?: string | undefined;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly pageSize: PageSize;

  private constructor(params: ReportFilterParams) {
    this.period = params.period;
    this.customerIds = params.customerIds;
    this.paperTypeIds = params.paperTypeIds;
    this.origin = params.origin;
    this.statuses = params.statuses;
    this.grouping = params.grouping ?? ReportGrouping.NONE;
    this.sortColumn = params.sortColumn;
    this.sortDirection = params.sortDirection ?? 'DESC';
    this.page = params.page ?? 1;
    this.pageSize = params.pageSize ?? 50;
  }

  static create(params: Partial<ReportFilterParams> & { period: PeriodFilter }): ReportFilter {
    return new ReportFilter({
      ...params,
      pageSize: params.pageSize ?? 50,
    });
  }

  static fromQueryParams(query: Record<string, unknown>): ReportFilter {
    const { startDate, endDate } = query;
    if (!startDate || !endDate) {
      throw new Error('Período é obrigatório');
    }

    const period = PeriodFilter.custom(new Date(startDate as string), new Date(endDate as string));

    // Validar intervalo de 1 ano
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

    return ReportFilter.create({
      period,
      customerIds: parseArray(query['customerIds']),
      paperTypeIds: parseArray(query['paperTypeIds']),
      origin: parseArray(query['origin']) as ('SHOPEE' | 'MANUAL')[] | undefined,
      statuses: parseArray(query['statuses']) as OrderStatus[] | undefined,
      grouping: (query['grouping'] as ReportGrouping) ?? ReportGrouping.NONE,
      sortColumn: query['sortColumn'] as string | undefined,
      sortDirection: (query['sortDirection'] as SortDirection) ?? 'DESC',
      page: query['page'] ? Number(query['page']) : 1,
      pageSize: query['pageSize'] ? (Number(query['pageSize']) as PageSize) : 50,
    });
  }

  getOffset(): number {
    return (this.page - 1) * this.pageSize;
  }
}
