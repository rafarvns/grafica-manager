import { describe, it, expect, vi } from 'vitest';
import { ExportReportUseCase } from '@/application/use-cases/ExportReportUseCase';
import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

const period = PeriodFilter.custom(new Date('2026-04-01'), new Date('2026-04-30'));

const sampleRows = [
  { label: 'Maria Silva', printCount: 10, revenue: 200, cost: 80, grossMarginPercent: 60, netMarginPercent: 60 },
  { label: 'João Santos', printCount: 5, revenue: 100, cost: 40, grossMarginPercent: 60, netMarginPercent: 60 },
];

function makeRepo(rows = sampleRows) {
  return {
    streamReportRows: vi.fn().mockImplementation(async function* () {
      for (const row of rows) yield row;
    }),
  };
}

function makeExcelExporter() {
  return {
    generate: vi.fn().mockResolvedValue(Buffer.from('fake-excel')),
  };
}

describe('ExportReportUseCase — CSV', () => {
  it('returns CSV string with header row', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[0]).toBe('Grupo,Impressões,Receita,Custo,Margem Bruta (%)');
  });

  it('returns one row per data record', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines).toHaveLength(3); // header + 2 data rows
  });

  it('contains data values in rows', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[1]).toContain('Maria Silva');
    expect(lines[1]).toContain('200');
    expect(lines[1]).toContain('80');
    expect(lines[1]).toContain('60');
  });

  it('escapes commas in field values with double quotes (RFC 4180)', async () => {
    const repo = makeRepo([
      { label: 'Empresa, Ltda', printCount: 1, revenue: 50, cost: 20, grossMarginPercent: 60, netMarginPercent: 60 },
    ]);
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[1]).toContain('"Empresa, Ltda"');
  });

  it('escapes double-quotes in field values by doubling them (RFC 4180)', async () => {
    const repo = makeRepo([
      { label: 'Nome "Apelido" Silva', printCount: 1, revenue: 50, cost: 20, grossMarginPercent: 60, netMarginPercent: 60 },
    ]);
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines[1]).toContain('"Nome ""Apelido"" Silva"');
  });

  it('returns empty CSV (header only) when no rows', async () => {
    const repo = makeRepo([]);
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const csv = await useCase.exportCsv(filter);
    const lines = csv.split('\n').filter(Boolean);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Grupo,Impressões,Receita,Custo,Margem Bruta (%)');
  });
});

describe('ExportReportUseCase — Excel', () => {
  it('calls excel exporter with all rows', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    await useCase.exportExcel(filter);

    expect(excel.generate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Maria Silva', revenue: 200 }),
        expect.objectContaining({ label: 'João Santos', revenue: 100 }),
      ])
    );
  });

  it('returns Buffer from excel exporter', async () => {
    const repo = makeRepo();
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    const buffer = await useCase.exportExcel(filter);

    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('returns empty rows to excel exporter when no data', async () => {
    const repo = makeRepo([]);
    const excel = makeExcelExporter();
    const useCase = new ExportReportUseCase(repo, excel);
    const filter = ReportFilter.create({ period });

    await useCase.exportExcel(filter);

    expect(excel.generate).toHaveBeenCalledWith([]);
  });
});
