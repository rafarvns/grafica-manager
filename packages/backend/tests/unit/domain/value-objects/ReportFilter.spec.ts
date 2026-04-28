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
      'Selecione um período para gerar o relatório'
    );
  });

  it('throws when only from is provided', () => {
    expect(() => ReportFilter.fromQueryParams({ from: '2026-04-01' })).toThrow(
      'Selecione um período para gerar o relatório'
    );
  });

  it('throws when only to is provided', () => {
    expect(() => ReportFilter.fromQueryParams({ to: '2026-04-30' })).toThrow(
      'Selecione um período para gerar o relatório'
    );
  });

  it('creates filter with period only', () => {
    const filter = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30' });
    expect(filter.period).toBeDefined();
    expect(filter.customerId).toBeUndefined();
    expect(filter.origin).toBeUndefined();
    expect(filter.paperTypeId).toBeUndefined();
  });

  it('creates filter with all optional fields', () => {
    const filter = ReportFilter.fromQueryParams({
      from: '2026-04-01',
      to: '2026-04-30',
      customerId: 'cid-123',
      origin: 'SHOPEE',
      paperTypeId: 'pid-456',
      grouping: 'CLIENT',
      sortColumn: 'revenue',
      sortDirection: 'DESC',
      page: '2',
      pageSize: '50',
    });
    expect(filter.customerId).toBe('cid-123');
    expect(filter.origin).toBe('SHOPEE');
    expect(filter.paperTypeId).toBe('pid-456');
    expect(filter.grouping).toBe(ReportGrouping.CLIENT);
    expect(filter.sortColumn).toBe('revenue');
    expect(filter.sortDirection).toBe('DESC');
    expect(filter.page).toBe(2);
    expect(filter.pageSize).toBe(50);
  });

  it('defaults grouping to NONE', () => {
    const filter = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30' });
    expect(filter.grouping).toBe(ReportGrouping.NONE);
  });

  it('defaults sortDirection to ASC', () => {
    const filter = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30' });
    expect(filter.sortDirection).toBe('ASC');
  });

  it('defaults page to 1 and pageSize to 25', () => {
    const filter = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30' });
    expect(filter.page).toBe(1);
    expect(filter.pageSize).toBe(25);
  });

  it('accepts pageSize 25', () => {
    const f = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30', pageSize: '25' });
    expect(f.pageSize).toBe(25);
  });

  it('accepts pageSize 50', () => {
    const f = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30', pageSize: '50' });
    expect(f.pageSize).toBe(50);
  });

  it('accepts pageSize 100', () => {
    const f = ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30', pageSize: '100' });
    expect(f.pageSize).toBe(100);
  });

  it('rejects invalid pageSize', () => {
    expect(() =>
      ReportFilter.fromQueryParams({ from: '2026-04-01', to: '2026-04-30', pageSize: '200' })
    ).toThrow();
  });
});

describe('ReportFilter.create', () => {
  it('creates from PeriodFilter directly', () => {
    const filter = ReportFilter.create({ period });
    expect(filter.period).toBe(period);
    expect(filter.grouping).toBe(ReportGrouping.NONE);
    expect(filter.page).toBe(1);
    expect(filter.pageSize).toBe(25);
    expect(filter.sortDirection).toBe('ASC');
  });

  it('throws if period is undefined', () => {
    expect(() => ReportFilter.create({ period: undefined as unknown as PeriodFilter })).toThrow();
  });

  it('accepts all optional fields', () => {
    const filter = ReportFilter.create({
      period,
      customerId: 'cid-1',
      origin: 'MANUAL',
      paperTypeId: 'pid-1',
      grouping: ReportGrouping.PAPER,
      sortColumn: 'cost',
      sortDirection: 'DESC',
      page: 3,
      pageSize: 100,
    });
    expect(filter.customerId).toBe('cid-1');
    expect(filter.grouping).toBe(ReportGrouping.PAPER);
    expect(filter.sortDirection).toBe('DESC');
    expect(filter.pageSize).toBe(100);
  });
});

describe('ReportFilter.getOffset', () => {
  it('returns 0 for page 1', () => {
    const filter = ReportFilter.create({ period, page: 1, pageSize: 25 });
    expect(filter.getOffset()).toBe(0);
  });

  it('calculates offset for page 2', () => {
    const filter = ReportFilter.create({ period, page: 2, pageSize: 25 });
    expect(filter.getOffset()).toBe(25);
  });

  it('calculates offset for page 3 with pageSize 50', () => {
    const filter = ReportFilter.create({ period, page: 3, pageSize: 50 });
    expect(filter.getOffset()).toBe(100);
  });
});

describe('ReportGrouping enum', () => {
  it('has expected values', () => {
    expect(ReportGrouping.NONE).toBeDefined();
    expect(ReportGrouping.CLIENT).toBeDefined();
    expect(ReportGrouping.PAPER).toBeDefined();
    expect(ReportGrouping.ORIGIN).toBeDefined();
    expect(ReportGrouping.PERIOD).toBeDefined();
  });
});
