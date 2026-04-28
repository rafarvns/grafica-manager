import { describe, it, expect, vi } from 'vitest';
import { GenerateReportUseCase } from '@/application/use-cases/GenerateReportUseCase';
import { ReportFilter, ReportGrouping } from '@/domain/value-objects/ReportFilter';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

const period = PeriodFilter.custom(
  new Date('2026-04-01T00:00:00.000Z'),
  new Date('2026-04-30T23:59:59.999Z')
);

type RawRow = { label: string; printCount: number; revenue: number; cost: number };

function makeRepo(overrides: Partial<{ queryReportRows: (f: ReportFilter) => Promise<{ rows: RawRow[]; total: number }> }> = {}) {
  return {
    queryReportRows: vi.fn<[ReportFilter], Promise<{ rows: RawRow[]; total: number }>>().mockResolvedValue({ rows: [], total: 0 }),
    ...overrides,
  };
}

describe('GenerateReportUseCase', () => {
  it('returns empty result when no rows', async () => {
    const repo = makeRepo();
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period });

    const result = await useCase.execute({ filter });

    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('returns rows with margin calculations applied', async () => {
    const repo = makeRepo({
      queryReportRows: vi.fn().mockResolvedValue({
        rows: [{ label: 'Maria', printCount: 10, revenue: 200, cost: 80 }],
        total: 1,
      }),
    });
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period });

    const result = await useCase.execute({ filter });

    expect(result.rows[0]).toMatchObject({
      label: 'Maria',
      printCount: 10,
      revenue: 200,
      cost: 80,
      grossMarginPercent: 60,
      netMarginPercent: 60,
    });
  });

  it('passes filter to repository', async () => {
    const repo = makeRepo();
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period, customerId: 'cid-1' });

    await useCase.execute({ filter });

    expect(repo.queryReportRows).toHaveBeenCalledWith(filter);
  });

  it('calculates totalPages correctly', async () => {
    const repo = makeRepo({
      queryReportRows: vi.fn().mockResolvedValue({
        rows: Array.from({ length: 25 }, (_, i) => ({
          label: `Row ${i}`,
          printCount: 1,
          revenue: 10,
          cost: 5,
        })),
        total: 75,
      }),
    });
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period, pageSize: 25 });

    const result = await useCase.execute({ filter });

    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it('returns correct page and pageSize in result', async () => {
    const repo = makeRepo({
      queryReportRows: vi.fn().mockResolvedValue({ rows: [], total: 100 }),
    });
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period, page: 2, pageSize: 50 });

    const result = await useCase.execute({ filter });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.totalPages).toBe(2);
  });

  it('uses grouping in filter passed to repo', async () => {
    const repo = makeRepo();
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period, grouping: ReportGrouping.CLIENT });

    await useCase.execute({ filter });

    expect(repo.queryReportRows).toHaveBeenCalledWith(
      expect.objectContaining({ grouping: ReportGrouping.CLIENT })
    );
  });

  it('computes grossMarginPercent 0 when revenue is 0', async () => {
    const repo = makeRepo({
      queryReportRows: vi.fn().mockResolvedValue({
        rows: [{ label: 'Sem receita', printCount: 5, revenue: 0, cost: 0 }],
        total: 1,
      }),
    });
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period });

    const result = await useCase.execute({ filter });

    expect(result.rows[0]?.grossMarginPercent).toBe(0);
    expect(result.rows[0]?.netMarginPercent).toBe(0);
  });
});
