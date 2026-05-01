import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { GenerateReportUseCase } from '@/application/use-cases/GenerateReportUseCase';
import { ExportReportUseCase, IPdfExporter } from '@/application/use-cases/ExportReportUseCase';
import { PrismaReportRepository } from '@/infrastructure/database/PrismaReportRepository';
import { ExcelExporter } from '@/infrastructure/exporters/ExcelExporter';
import { PdfExporter } from '@/infrastructure/exporters/PdfExporter';
import { PrintJobReportFilter } from '@/domain/value-objects/PrintJobReportFilter';
import { GeneratePrintJobReportUseCase } from '@/application/use-cases/GeneratePrintJobReportUseCase';
import { ExportPrintJobReportUseCase } from '@/application/use-cases/ExportPrintJobReportUseCase';
import { PrismaPrintJobReportRepository } from '@/infrastructure/database/PrismaPrintJobReportRepository';
import { PrintJobExcelExporter } from '@/infrastructure/exporters/PrintJobExcelExporter';

export function createReportsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/generate', async (req: Request, res: Response) => {
    try {
      const filter = ReportFilter.fromQueryParams(req.query as Record<string, unknown>);
      const repo = new PrismaReportRepository(prisma);
      const result = await new GenerateReportUseCase(repo).execute({ filter });
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.post('/export', async (req: Request, res: Response) => {
    try {
      const { filters, format } = req.body;
      const filter = ReportFilter.fromQueryParams(filters as Record<string, unknown>);
      const repo = new PrismaReportRepository(prisma);
      const excel = new ExcelExporter();
      const pdf = new PdfExporter();
      const useCase = new ExportReportUseCase(repo, excel, pdf);

      if (format === 'csv') {
        const csv = await useCase.exportCsv(filter);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio.csv"');
        return res.send('﻿' + csv);
      }

      if (format === 'excel') {
        const buffer = await useCase.exportExcel(filter);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio.xlsx"');
        return res.send(buffer);
      }

      if (format === 'pdf') {
        const buffer = await useCase.exportPdf(filter);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio.pdf"');
        return res.send(buffer);
      }

      return res.status(400).json({ error: 'Formato inválido' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      return res.status(400).json({ error: msg });
    }
  });

  // ─── Relatório de Impressões ──────────────────────────────────────────────

  router.get('/print-jobs', async (req: Request, res: Response) => {
    try {
      const filter = PrintJobReportFilter.fromQueryParams(req.query as Record<string, unknown>);
      const repo = new PrismaPrintJobReportRepository(prisma);
      const result = await new GeneratePrintJobReportUseCase(repo).execute({ filter });
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.post('/print-jobs/export', async (req: Request, res: Response) => {
    try {
      const { filters, format } = req.body as { filters: Record<string, unknown>; format: string };
      const filter = PrintJobReportFilter.fromQueryParams(filters);
      const repo = new PrismaPrintJobReportRepository(prisma);
      const excel = new PrintJobExcelExporter();
      const useCase = new ExportPrintJobReportUseCase(repo, excel);

      if (format === 'csv') {
        const csv = await useCase.exportCsv(filter);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="impressoes.csv"');
        return res.send('﻿' + csv);
      }

      if (format === 'excel') {
        const buffer = await useCase.exportExcel(filter);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="impressoes.xlsx"');
        return res.send(buffer);
      }

      return res.status(400).json({ error: 'Formato inválido. Use csv ou excel.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      return res.status(400).json({ error: msg });
    }
  });

  return router;
}
