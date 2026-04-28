import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { ReportRow } from '@/application/dtos/ReportDTO';

export interface IReportStreamRepository {
  streamReportRows(filter: ReportFilter): AsyncIterable<ReportRow>;
}

export interface IExcelExporter {
  generate(rows: ReportRow[]): Promise<Buffer>;
}

const CSV_HEADER = 'Grupo,Impressões,Receita,Custo,Margem Bruta (%)';

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsv(row: ReportRow): string {
  return [
    csvEscape(row.label),
    String(row.printCount),
    String(row.revenue),
    String(row.cost),
    String(row.grossMarginPercent),
  ].join(',');
}

export class ExportReportUseCase {
  constructor(
    private readonly repo: IReportStreamRepository,
    private readonly excelExporter: IExcelExporter
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
}
