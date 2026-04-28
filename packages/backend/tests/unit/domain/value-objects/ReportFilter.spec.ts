import { describe, it, expect } from 'vitest';
import { ReportFilter, ReportGrouping } from '@/domain/value-objects/ReportFilter';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

const period = PeriodFilter.custom(
  new Date('2026-04-01T00:00:00.000Z'),
  new Date('2026-04-30T23:59:59.999Z')
);

describe('ReportFilter.fromQueryParams', () => {
  it('throws when period is missing', () => {
    expect(() => ReportFilter.fromQueryParams({})).toThrow(
      'Período é obrigatório'
    );
  });

  it('throws when only startDate is provided', () => {
    expect(() => ReportFilter.fromQueryParams({ startDate: '2026-04-01' })).toThrow(
      'Período é obrigatório'
    );
  });

  it('creates filter with period only', () => {
    const filter = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(filter.period).toBeDefined();
    expect(filter.customerIds).toBeUndefined();
    expect(filter.origin).toBeUndefined();
    expect(filter.paperTypeIds).toBeUndefined();
  });

  it('creates filter with all optional fields', () => {
    const filter = ReportFilter.fromQueryParams({
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      customerIds: 'cid-123',
      origin: 'SHOPEE',
      paperTypeIds: 'pid-456',
      grouping: 'customer',
      sortColumn: 'revenue',
      sortDirection: 'DESC',
      page: '2',
      pageSize: '50',
    });
    expect(filter.customerIds).toContain('cid-123');
    expect(filter.origin).toContain('SHOPEE');
    expect(filter.paperTypeIds).toContain('pid-456');
    expect(filter.grouping).toBe(ReportGrouping.CUSTOMER);
    expect(filter.sortColumn).toBe('revenue');
    expect(filter.sortDirection).toBe('DESC');
    expect(filter.page).toBe(2);
    expect(filter.pageSize).toBe(50);
  });

  it('defaults grouping to NONE', () => {
    const filter = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(filter.grouping).toBe(ReportGrouping.NONE);
  });

  it('defaults sortDirection to DESC', () => {
    const filter = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(filter.sortDirection).toBe('DESC');
  });

  it('defaults page to 1 and pageSize to 50', () => {
    const filter = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(filter.page).toBe(1);
    expect(filter.pageSize).toBe(50);
  });

  it('accepts pageSize 25', () => {
    const f = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30', pageSize: '25' });
    expect(f.pageSize).toBe(25);
  });

  it('accepts pageSize 50', () => {
    const f = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30', pageSize: '50' });
    expect(f.pageSize).toBe(50);
  });

  it('accepts pageSize 100', () => {
    const f = ReportFilter.fromQueryParams({ startDate: '2026-04-01', endDate: '2026-04-30', pageSize: '100' });
    expect(f.pageSize).toBe(100);
  });
});

describe('ReportFilter.create', () => {
  it('creates from PeriodFilter directly', () => {
    const filter = ReportFilter.create({ period });
    expect(filter.period).toBe(period);
    expect(filter.grouping).toBe(ReportGrouping.NONE);
    expect(filter.page).toBe(1);
    expect(filter.pageSize).toBe(50);
    expect(filter.sortDirection).toBe('DESC');
  });

  it('accepts all optional fields', () => {
    const filter = ReportFilter.create({
      period,
      customerIds: ['cid-1'],
      origin: ['MANUAL'],
      paperTypeIds: ['pid-1'],
      grouping: ReportGrouping.PAPER,
      sortColumn: 'cost',
      sortDirection: 'ASC',
      page: 3,
      pageSize: 100,
    });
    expect(filter.customerIds).toContain('cid-1');
    expect(filter.grouping).toBe(ReportGrouping.PAPER);
    expect(filter.sortDirection).toBe('ASC');
    expect(filter.pageSize).toBe(100);
  });
});

describe('ReportFilter.getOffset', () => {
  it('returns 0 for page 1', () => {
    const filter = ReportFilter.create({ period, page: 1, pageSize: 50 });
    expect(filter.getOffset()).toBe(0);
  });

  it('calculates offset for page 2', () => {
    const filter = ReportFilter.create({ period, page: 2, pageSize: 50 });
    expect(filter.getOffset()).toBe(50);
  });

  it('calculates offset for page 3 with pageSize 100', () => {
    const filter = ReportFilter.create({ period, page: 3, pageSize: 100 });
    expect(filter.getOffset()).toBe(200);
  });
});

describe('ReportGrouping enum', () => {
  it('has expected values', () => {
    expect(ReportGrouping.NONE).toBeDefined();
    expect(ReportGrouping.CUSTOMER).toBeDefined();
    expect(ReportGrouping.PAPER).toBeDefined();
    expect(ReportGrouping.ORIGIN).toBeDefined();
    expect(ReportGrouping.ORDER).toBeDefined();
  });
});
