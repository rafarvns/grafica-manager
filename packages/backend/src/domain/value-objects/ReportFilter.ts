import { PeriodFilter } from './PeriodFilter';

export enum ReportGrouping {
  NONE = 'NONE',
  CLIENT = 'CLIENT',
  PAPER = 'PAPER',
  ORIGIN = 'ORIGIN',
  PERIOD = 'PERIOD',
}

export type SortDirection = 'ASC' | 'DESC';

const VALID_PAGE_SIZES = [25, 50, 100] as const;
type PageSize = (typeof VALID_PAGE_SIZES)[number];

export interface ReportFilterParams {
  period: PeriodFilter;
  customerId?: string;
  origin?: string;
  paperTypeId?: string;
  grouping?: ReportGrouping;
  sortColumn?: string;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: PageSize;
}

export class ReportFilter {
  readonly period: PeriodFilter;
  readonly customerId?: string;
  readonly origin?: string;
  readonly paperTypeId?: string;
  readonly grouping: ReportGrouping;
  readonly sortColumn?: string;
  readonly sortDirection: SortDirection;
  readonly page: number;
  readonly pageSize: PageSize;

  private constructor(
    period: PeriodFilter,
    grouping: ReportGrouping,
    sortDirection: SortDirection,
    page: number,
    pageSize: PageSize,
    customerId?: string,
    origin?: string,
    paperTypeId?: string,
    sortColumn?: string
  ) {
    this.period = period;
    this.grouping = grouping;
    this.sortDirection = sortDirection;
    this.page = page;
    this.pageSize = pageSize;
    if (customerId !== undefined) this.customerId = customerId;
    if (origin !== undefined) this.origin = origin;
    if (paperTypeId !== undefined) this.paperTypeId = paperTypeId;
    if (sortColumn !== undefined) this.sortColumn = sortColumn;
  }

  static create(params: ReportFilterParams): ReportFilter {
    if (!params.period) {
      throw new Error('Selecione um período para gerar o relatório');
    }
    const pageSize = params.pageSize ?? 25;
    if (!VALID_PAGE_SIZES.includes(pageSize as PageSize)) {
      throw new Error(`Tamanho de página inválido: ${pageSize}. Valores aceitos: 25, 50, 100`);
    }
    return new ReportFilter(
      params.period,
      params.grouping ?? ReportGrouping.NONE,
      params.sortDirection ?? 'ASC',
      params.page ?? 1,
      pageSize as PageSize,
      params.customerId,
      params.origin,
      params.paperTypeId,
      params.sortColumn
    );
  }

  static fromQueryParams(query: Record<string, unknown>): ReportFilter {
    const { from, to } = query;
    if (!from || !to) {
      throw new Error('Selecione um período para gerar o relatório');
    }

    const period = PeriodFilter.custom(new Date(from as string), new Date(to as string));

    const rawPageSize = query['pageSize'] ? Number(query['pageSize']) : 25;
    if (!VALID_PAGE_SIZES.includes(rawPageSize as PageSize)) {
      throw new Error(`Tamanho de página inválido: ${rawPageSize}. Valores aceitos: 25, 50, 100`);
    }

    const rawGrouping = query['grouping'] as string | undefined;
    const grouping =
      rawGrouping && rawGrouping in ReportGrouping
        ? ReportGrouping[rawGrouping as keyof typeof ReportGrouping]
        : ReportGrouping.NONE;

    return new ReportFilter(
      period,
      grouping,
      (query['sortDirection'] as SortDirection | undefined) ?? 'ASC',
      query['page'] ? Number(query['page']) : 1,
      rawPageSize as PageSize,
      query['customerId'] as string | undefined,
      query['origin'] as string | undefined,
      query['paperTypeId'] as string | undefined,
      query['sortColumn'] as string | undefined
    );
  }

  getOffset(): number {
    return (this.page - 1) * this.pageSize;
  }
}
