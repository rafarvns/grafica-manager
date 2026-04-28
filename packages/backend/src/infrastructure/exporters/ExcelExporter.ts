import ExcelJS from 'exceljs';
import { ReportRow } from '@grafica/shared';
import { IExcelExporter } from '@/application/use-cases/ExportReportUseCase';

export class ExcelExporter implements IExcelExporter {
  async generate(rows: ReportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Relatório');

    sheet.columns = [
      { header: 'Número', key: 'orderNumber', width: 15 },
      { header: 'Cliente', key: 'customerName', width: 30 },
      { header: 'Papel', key: 'paperType', width: 20 },
      { header: 'Quantidade', key: 'quantity', width: 14 },
      { header: 'Venda (R$)', key: 'salePrice', width: 16 },
      { header: 'Custo (R$)', key: 'cost', width: 16 },
      { header: 'Margem (%)', key: 'marginPercent', width: 16 },
      { header: 'Data', key: 'date', width: 20 },
    ];

    for (const row of rows) {
      sheet.addRow(row);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
