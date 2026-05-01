import type { PrintJobReportRow } from '@grafica/shared';
import type { IPrintJobReportRepository } from './GeneratePrintJobReportUseCase';
import { PrintJobReportFilter } from '@/domain/value-objects/PrintJobReportFilter';

export interface IPrintJobExcelExporter {
  generate(rows: PrintJobReportRow[]): Promise<Buffer>;
}

const CSV_HEADER =
  'Data,Documento,Papel,Gram.,Cor,Qualidade,Pgs P&B,Pgs Color,Total Pgs,Custo,Status,Impressora,Preset,Pedido,Cliente';

function csvEscape(value: string | number | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(row: PrintJobReportRow): string {
  return [
    csvEscape(row.printedAt),
    csvEscape(row.documentName),
    csvEscape(row.paperTypeName),
    csvEscape(row.paperWeight),
    csvEscape(row.colorProfile),
    csvEscape(row.quality),
    csvEscape(row.pagesBlackAndWhite),
    csvEscape(row.pagesColor),
    csvEscape(row.totalPages),
    csvEscape(row.registeredCost),
    csvEscape(row.status),
    csvEscape(row.printerName),
    csvEscape(row.presetName),
    csvEscape(row.orderNumber),
    csvEscape(row.customerName),
  ].join(',');
}

export class ExportPrintJobReportUseCase {
  constructor(
    private readonly repo: IPrintJobReportRepository,
    private readonly excelExporter: IPrintJobExcelExporter
  ) {}

  async exportCsv(filter: PrintJobReportFilter): Promise<string> {
    const rows = await this.repo.queryAllRows(filter);
    const lines = [CSV_HEADER, ...rows.map(rowToCsv)];
    return lines.join('\n');
  }

  async exportExcel(filter: PrintJobReportFilter): Promise<Buffer> {
    const rows = await this.repo.queryAllRows(filter);
    return this.excelExporter.generate(rows);
  }
}
