import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { ReportRow } from '@grafica/shared';

export interface IReportStreamRepository {
  streamReportRows(filter: ReportFilter): AsyncIterable<ReportRow>;
}

export interface IExcelExporter {
  generate(rows: ReportRow[]): Promise<Buffer>;
}

export interface IPdfExporter {
  generate(rows: ReportRow[]): Promise<Buffer>;
}

const CSV_HEADER = 'Número,Cliente,Papel,Quantidade,Venda,Custo,Margem (%),Data';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row: ReportRow): string {
  return [
    csvEscape(row.orderNumber),
    csvEscape(row.customerName),
    csvEscape(row.paperType),
    csvEscape(row.quantity),
    csvEscape(row.salePrice),
    csvEscape(row.cost),
    csvEscape(row.marginPercent),
    csvEscape(row.date),
  ].join(',');
}

export class ExportReportUseCase {
  constructor(
    private readonly repo: IReportStreamRepository,
    private readonly excelExporter: IExcelExporter,
    private readonly pdfExporter: IPdfExporter
  ) {}

  async exportCsv(filter: ReportFilter): Promise<string> {
    const lines: string[] = [CSV_HEADER];
    for await (const row of this.repo.streamReportRows(filter)) {
      lines.push(rowToCsv(row));
    }
    return lines.join('\n');
  }

  async exportExcel(filter: ReportFilter): Promise<Buffer> {
    const rows: ReportRow[] = [];
    for await (const row of this.repo.streamReportRows(filter)) {
      rows.push(row);
    }
    return this.excelExporter.generate(rows);
  }

  async exportPdf(filter: ReportFilter): Promise<Buffer> {
    const rows: ReportRow[] = [];
    for await (const row of this.repo.streamReportRows(filter)) {
      rows.push(row);
    }
    return this.pdfExporter.generate(rows);
  }
}
