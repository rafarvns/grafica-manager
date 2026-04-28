import ExcelJS from 'exceljs';
import { ReportRow } from '@/application/dtos/ReportDTO';
import { IExcelExporter } from '@/application/use-cases/ExportReportUseCase';

export class ExcelExporter implements IExcelExporter {
  async generate(rows: ReportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Relatório');

    sheet.columns = [
      { header: 'Grupo', key: 'label', width: 30 },
      { header: 'Impressões', key: 'printCount', width: 14 },
      { header: 'Receita (R$)', key: 'revenue', width: 16 },
      { header: 'Custo (R$)', key: 'cost', width: 16 },
      { header: 'Margem Bruta (%)', key: 'grossMarginPercent', width: 18 },
      { header: 'Margem Líquida (%)', key: 'netMarginPercent', width: 20 },
    ];

    for (const row of rows) {
      sheet.addRow(row);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
