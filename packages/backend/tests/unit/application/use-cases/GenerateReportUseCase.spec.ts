import { describe, it, expect, vi } from 'vitest';
import { GenerateReportUseCase, IReportQueryRepository } from '@/application/use-cases/GenerateReportUseCase';
import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';
import { ReportRow } from '@grafica/shared';

const period = PeriodFilter.custom(
  new Date('2026-04-01T00:00:00.000Z'),
  new Date('2026-04-30T23:59:59.999Z')
);

function makeRepo(overrides: Partial<IReportQueryRepository> = {}) {
  return {
    queryReportRows: vi.fn().mockResolvedValue({ rows: [], totalCount: 0 }),
    ...overrides,
  } as IReportQueryRepository;
}

describe('GenerateReportUseCase', () => {
  it('returns empty result when no rows', async () => {
    const repo = makeRepo();
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period });

    const result = await useCase.execute({ filter });

    expect(result.rows).toHaveLength(0);
    expect(result.totals.totalOrders).toBe(0);
    expect(result.pagination.totalCount).toBe(0);
  });

  it('returns rows with correct structure and calculations', async () => {
    const mockRow: ReportRow = {
      orderId: '1',
      orderNumber: 'ORD-001',
      customerId: 'cust-1',
      customerName: 'João Silva',
      paperType: 'Couchê',
      quantity: 10,
      salePrice: 100,
      cost: 40,
      margin: 60,
      marginPercent: 60,
      date: '2026-04-05T10:00:00Z',
      origin: 'MANUAL',
    };

    const repo = makeRepo({
      queryReportRows: vi.fn().mockResolvedValue({
        rows: [mockRow],
        totalCount: 1,
      }),
    });
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period });

    const result = await useCase.execute({ filter });

    expect(result.rows[0]).toEqual(mockRow);
    expect(result.totals).toEqual({
      totalOrders: 1,
      totalQuantity: 10,
      totalCost: 40,
      totalRevenue: 100,
      totalMargin: 60,
      marginPercent: 60,
      ticketAverage: 100,
    });
  });

  it('calculates totals correctly for multiple rows', async () => {
    const rows: ReportRow[] = [
      {
        orderId: '1',
        orderNumber: 'ORD-001',
        customerId: 'cust-1',
        customerName: 'João',
        paperType: 'A',
        quantity: 5,
        salePrice: 50,
        cost: 20,
        margin: 30,
        marginPercent: 60,
        date: '2026-04-01T10:00:00Z',
        origin: 'MANUAL',
      },
      {
        orderId: '2',
        orderNumber: 'ORD-002',
        customerId: 'cust-2',
        customerName: 'Maria',
        paperType: 'B',
        quantity: 15,
        salePrice: 150,
        cost: 30,
        margin: 120,
        marginPercent: 80,
        date: '2026-04-02T10:00:00Z',
        origin: 'SHOPEE',
      },
    ];

    const repo = makeRepo({
      queryReportRows: vi.fn().mockResolvedValue({
        rows,
        totalCount: 2,
      }),
    });
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period });

    const result = await useCase.execute({ filter });

    expect(result.totals).toEqual({
      totalOrders: 2,
      totalQuantity: 20,
      totalCost: 50,
      totalRevenue: 200,
      totalMargin: 150,
      marginPercent: 75, // (150/200) * 100
      ticketAverage: 100, // 200 / 2
    });
  });

  it('passes filter to repository', async () => {
    const repo = makeRepo();
    const useCase = new GenerateReportUseCase(repo);
    const filter = ReportFilter.create({ period, customerId: 'cid-1' });

    await useCase.execute({ filter });

    expect(repo.queryReportRows).toHaveBeenCalledWith(filter);
  });
});
