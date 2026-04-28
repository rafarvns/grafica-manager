import { describe, it, expect, vi } from 'vitest';
import { ExportReportUseCase, IReportStreamRepository, IExcelExporter, IPdfExporter } from '@/application/use-cases/ExportReportUseCase';
import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';
import { ReportRow } from '@grafica/shared';

const period = PeriodFilter.custom(new Date('2026-04-01'), new Date('2026-04-30'));

const sampleRows: ReportRow[] = [
  {
    orderId: '1',
    orderNumber: 'ORD-001',
    customerId: 'cust-1',
    customerName: 'Maria Silva',
    paperType: 'Couchê',
    quantity: 10,
    salePrice: 200,
    cost: 80,
    margin: 120,
    marginPercent: 60,
    date: '2026-04-05T10:00:00Z',
    origin: 'MANUAL',
  },
  {
    orderId: '2',
    orderNumber: 'ORD-002',
    customerId: 'cust-2',
    customerName: 'João Santos',
    paperType: 'Sulfite',
    quantity: 5,
    salePrice: 100,
    cost: 40,
    margin: 60,
    marginPercent: 60,
    date: '2026-04-06T10:00:00Z',
    origin: 'SHOPEE',
  },
];

function makeRepo(rows = sampleRows): IReportStreamRepository {
  return {
    streamReportRows: vi.fn().mockImplementation(async function* () {
      for (const row of rows) yield row;
    }),
  };
}

function makeExcelExporter(): IExcelExporter {
  return {
    generate: vi.fn().mockResolvedValue(Buffer.from('fake-excel')),
  };
}

function makePdfExporter(): IPdfExporter {
  return {
    generate: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  };
}

describe('ExportReportUseCase — CSV', () => {
  it('returns CSV string with new header row', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const pdf = makePdfExporter();
    const useCase = new ExportReportUseCase(repo, excel, pdf);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[0]).toBe('Número,Cliente,Papel,Quantidade,Venda,Custo,Margem (%),Data');
  });

  it('contains correct data values in rows', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const pdf = makePdfExporter();
    const useCase = new ExportReportUseCase(repo, excel, pdf);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[1]).toContain('ORD-001');
    expect(lines[1]).toContain('Maria Silva');
    expect(lines[1]).toContain('Couchê');
    expect(lines[1]).toContain('10');
    expect(lines[1]).toContain('200');
    expect(lines[1]).toContain('80');
    expect(lines[1]).toContain('60');
  });

  it('escapes commas in field values', async () => {
    const repo = makeRepo([
      {
        ...sampleRows[0],
        customerName: 'Empresa, Ltda',
      },
    ]);
    const excel = makeExcelExporter();
    const pdf = makePdfExporter();
    const useCase = new ExportReportUseCase(repo, excel, pdf);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[1]).toContain('"Empresa, Ltda"');
  });
});

describe('ExportReportUseCase — Excel', () => {
  it('calls excel exporter with all rows', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const pdf = makePdfExporter();
    const useCase = new ExportReportUseCase(repo, excel, pdf);
    const filter = ReportFilter.create({ period });

    await useCase.exportExcel(filter);

    expect(excel.generate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ orderNumber: 'ORD-001', customerName: 'Maria Silva' }),
      ])
    );
  });
});

describe('ExportReportUseCase — PDF', () => {
  it('calls pdf exporter with all rows', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const pdf = makePdfExporter();
    const useCase = new ExportReportUseCase(repo, excel, pdf);
    const filter = ReportFilter.create({ period });

    await useCase.exportPdf(filter);

    expect(pdf.generate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ orderNumber: 'ORD-001', customerName: 'Maria Silva' }),
      ])
    );
  });

  it('returns Buffer from pdf exporter', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const pdf = makePdfExporter();
    const useCase = new ExportReportUseCase(repo, excel, pdf);
    const filter = ReportFilter.create({ period });

    const buffer = await useCase.exportPdf(filter);

    expect(buffer).toBeInstanceOf(Buffer);
  });
});
