import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportFilter } from '@/domain/value-objects/ReportFilter';
import { GenerateReportUseCase } from '@/application/use-cases/GenerateReportUseCase';
import { ExportReportUseCase } from '@/application/use-cases/ExportReportUseCase';
import { PrismaReportRepository } from '@/infrastructure/database/PrismaReportRepository';
import { ExcelExporter } from '@/infrastructure/exporters/ExcelExporter';

export function createReportsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const filter = ReportFilter.fromQueryParams(req.body as Record<string, unknown>);
      const repo = new PrismaReportRepository(prisma);
      const result = await new GenerateReportUseCase(repo).execute({ filter });
      res.json({ data: result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/export/csv', async (req: Request, res: Response) => {
    try {
      const filter = ReportFilter.fromQueryParams(req.query as Record<string, unknown>);
      const repo = new PrismaReportRepository(prisma);
      const excel = new ExcelExporter();
      const csv = await new ExportReportUseCase(repo, excel).exportCsv(filter);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio.csv"');
      res.send('﻿' + csv); // BOM for Excel UTF-8 compatibility
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/export/excel', async (req: Request, res: Response) => {
    try {
      const filter = ReportFilter.fromQueryParams(req.query as Record<string, unknown>);
      const repo = new PrismaReportRepository(prisma);
      const excel = new ExcelExporter();
      const buffer = await new ExportReportUseCase(repo, excel).exportExcel(filter);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio.xlsx"');
      res.send(buffer);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      res.status(400).json({ error: msg });
    }
  });

  router.get('/export/pdf', async (req: Request, res: Response) => {
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

  return router;
}
