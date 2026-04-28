import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPrintJobRepository } from '@/infrastructure/database/PrismaPrintJobRepository';
import { ListPrintJobsUseCase } from '@/application/use-cases/ListPrintJobsUseCase';
import { GetPrintJobUseCase } from '@/application/use-cases/GetPrintJobUseCase';
import { ReprocessPrintJobUseCase } from '@/application/use-cases/ReprocessPrintJobUseCase';
import { ExportPrintJobsUseCase } from '@/application/use-cases/ExportPrintJobsUseCase';
import { validate } from '@/infrastructure/http/middlewares/validate';
import { listPrintJobsSchema } from '@/application/validators/ListPrintJobsValidator';
import { getPrintJobSchema } from '@/application/validators/GetPrintJobValidator';
import { reprocessPrintJobSchema } from '@/application/validators/ReprocessPrintJobValidator';
import { exportPrintJobsSchema } from '@/application/validators/ExportPrintJobsValidator';

export function createPrintJobsRouter(prisma: PrismaClient): Router {
  const router = Router();
  const repo = new PrismaPrintJobRepository(prisma);

  // ─── GET /print-jobs — Listar com filtros, paginação, sorting ───
  router.get('/', validate(listPrintJobsSchema, 'query'), async (req: Request, res: Response) => {
    try {
      const useCase = new ListPrintJobsUseCase(repo);
      const result = await useCase.execute(req.query as any);
      res.json(result);
    } catch (error) {
      const status = error instanceof Error && error.message.includes('inválido') ? 400 : 500;
      res.status(status).json({ error: error instanceof Error ? error.message : 'Erro ao listar impressões' });
    }
  });

  // ─── GET /print-jobs/stats — Estatísticas (KPIs) ───
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, status, customerId, origin } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (status) filters.status = status;
      if (customerId) filters.customerId = customerId;
      if (origin) filters.origin = origin;

      const result = await repo.findWithFilters({ ...filters, exportAll: true });
      const jobs = result.data;

      const totalJobs = jobs.length;
      const totalCost = jobs.reduce((sum: number, j: any) => sum + (j.registeredCost || 0), 0);
      const successCount = jobs.filter((j: any) => j.status === 'sucesso').length;
      const successRate = totalJobs > 0 ? (successCount / totalJobs) * 100 : 0;

      res.json({ totalJobs, totalCost, successRate });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao calcular estatísticas' });
    }
  });

  // ─── GET /print-jobs/export — Export CSV/PDF ───
  router.get('/export', validate(exportPrintJobsSchema, 'query'), async (req: Request, res: Response) => {
    try {
      const { format, ...filters } = req.query as any;

      // CSV exporter simples
      const csvExporter = {
        async export(data: any[]): Promise<Buffer> {
          const headers = 'ID,Data,Cliente,Pedido,Status,Custo\n';
          const rows = data.map((j) =>
            `${j.id},"${j.createdAt?.toISOString?.() || j.createdAt}","${j.customerName || ''}","${j.orderNumber || ''}","${j.status}","${(j.registeredCost || 0).toFixed(2)}"`
          ).join('\n');
          return Buffer.from('\uFEFF' + headers + rows, 'utf-8');
        },
      };

      // PDF exporter placeholder (pdfkit seria usado aqui)
      const pdfExporter = {
        async export(data: any[]): Promise<Buffer> {
          // TODO: implementar com pdfkit quando necessário
          const headers = 'ID,Data,Cliente,Pedido,Status,Custo\n';
          const rows = data.map((j) =>
            `${j.id} | ${j.createdAt?.toISOString?.() || j.createdAt} | ${j.customerName || '-'} | ${j.orderNumber || '-'} | ${j.status} | R$${(j.registeredCost || 0).toFixed(2)}`
          ).join('\n');
          return Buffer.from(`Relatório de Impressões\n${'='.repeat(60)}\n${headers}${rows}`, 'utf-8');
        },
      };

      const useCase = new ExportPrintJobsUseCase(repo, csvExporter, pdfExporter);
      const buffer = await useCase.execute({ format, ...filters });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="impressoes.csv"');
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="impressoes.pdf"');
      }

      res.send(buffer);
    } catch (error) {
      const status = error instanceof Error && error.message.includes('inválido') ? 400 : 500;
      res.status(status).json({ error: error instanceof Error ? error.message : 'Erro ao exportar' });
    }
  });

  // ─── GET /print-jobs/:id — Detalhe de uma impressão ───
  router.get('/:id', validate(getPrintJobSchema, 'params'), async (req: Request, res: Response) => {
    try {
      const useCase = new GetPrintJobUseCase(repo);
      const result = await useCase.execute({ id: req.params.id! });
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('não encontrada')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao buscar impressão' });
      }
    }
  });

  // ─── POST /print-jobs/:id/reprocess — Reprocessar impressão com erro ───
  router.post('/:id/reprocess', validate(reprocessPrintJobSchema, 'params'), async (req: Request, res: Response) => {
    try {
      // Job queue placeholder — Bull seria injetado aqui
      const jobQueue = {
        async enqueue(jobId: string): Promise<void> {
          // TODO: integrar com Bull queue (ADR 0002)
        },
      };

      const useCase = new ReprocessPrintJobUseCase(repo, jobQueue);
      const result = await useCase.execute({ id: req.params.id! });
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('não encontrada')) {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes('Apenas')) {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Erro ao reprocessar impressão' });
      }
    }
  });

  return router;
}