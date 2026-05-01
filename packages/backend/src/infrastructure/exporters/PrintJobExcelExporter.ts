import ExcelJS from 'exceljs';
import type { PrintJobReportRow } from '@grafica/shared';
import type { IPrintJobExcelExporter } from '@/application/use-cases/ExportPrintJobReportUseCase';

export class PrintJobExcelExporter implements IPrintJobExcelExporter {
  async generate(rows: PrintJobReportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Impressões');

    sheet.columns = [
      { header: 'Data', key: 'printedAt', width: 22 },
      { header: 'Documento', key: 'documentName', width: 30 },
      { header: 'Papel', key: 'paperTypeName', width: 22 },
      { header: 'Gram. (g/m²)', key: 'paperWeight', width: 14 },
      { header: 'Cor', key: 'colorProfile', width: 12 },
      { header: 'Qualidade', key: 'quality', width: 12 },
      { header: 'Pgs P&B', key: 'pagesBlackAndWhite', width: 10 },
      { header: 'Pgs Color', key: 'pagesColor', width: 10 },
      { header: 'Total Pgs', key: 'totalPages', width: 10 },
      { header: 'Custo (R$)', key: 'registeredCost', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Impressora', key: 'printerName', width: 22 },
      { header: 'Preset', key: 'presetName', width: 18 },
      { header: 'Pedido', key: 'orderNumber', width: 16 },
      { header: 'Cliente', key: 'customerName', width: 28 },
    ];

    for (const row of rows) {
      sheet.addRow(row);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
