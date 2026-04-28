import PDFDocument from 'pdfkit';
import { ReportRow } from '@grafica/shared';
import { IPdfExporter } from '@/application/use-cases/ExportReportUseCase';

export class PdfExporter implements IPdfExporter {
  async generate(rows: ReportRow[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).text('Relatório de Pedidos', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
      doc.moveDown();

      // Table Header
      const tableTop = 150;
      const colWidths = [80, 150, 100, 60, 70, 70];
      const colNames = ['Número', 'Cliente', 'Papel', 'Qtd', 'Venda', 'Custo'];
      
      let x = 30;
      doc.fontSize(12).font('Helvetica-Bold');
      colNames.forEach((name, i) => {
        const width = colWidths[i] || 0;
        doc.text(name, x, tableTop);
        x += width;
      });

      doc.moveTo(30, tableTop + 15).lineTo(565, tableTop + 15).stroke();

      // Rows
      let y = tableTop + 25;
      doc.fontSize(10).font('Helvetica');

      rows.forEach((row) => {
        if (y > 750) {
          doc.addPage();
          y = 30;
        }

        const customer = row.customerName || 'Cliente Avulso';
        const paper = row.paperType || 'N/A';

        x = 30;
        doc.text(row.orderNumber || '-', x, y);
        x += colWidths[0];
        doc.text(customer.substring(0, 25), x, y);
        x += colWidths[1];
        doc.text(paper.substring(0, 15), x, y);
        x += colWidths[2];
        doc.text((row.quantity || 0).toString(), x, y);
        x += colWidths[3];
        doc.text(`R$ ${(row.salePrice || 0).toFixed(2)}`, x, y);
        x += colWidths[4];
        doc.text(`R$ ${(row.cost || 0).toFixed(2)}`, x, y);

        y += 20;
      });

      doc.end();
    });
  }
}
