import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ListOrdersUseCase } from '@/application/use-cases/ListOrdersUseCase';
import { CreateOrderUseCase } from '@/application/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '@/application/use-cases/GetOrderUseCase';
import { UpdateOrderUseCase } from '@/application/use-cases/UpdateOrderUseCase';
import { ChangeOrderStatusUseCase } from '@/application/use-cases/ChangeOrderStatusUseCase';
import { CancelOrderUseCase } from '@/application/use-cases/CancelOrderUseCase';
import { UploadOrderAttachmentUseCase } from '@/application/use-cases/UploadOrderAttachmentUseCase';
import { ListOrderAttachmentsUseCase } from '@/application/use-cases/ListOrderAttachmentsUseCase';
import { DownloadOrderAttachmentUseCase } from '@/application/use-cases/DownloadOrderAttachmentUseCase';
import { DeleteOrderAttachmentUseCase } from '@/application/use-cases/DeleteOrderAttachmentUseCase';
import { OrderAttachmentController } from '@/infrastructure/http/controllers/OrderAttachmentController';
import { PrismaOrderAttachmentRepository } from '@/infrastructure/database/repositories/PrismaOrderAttachmentRepository';
import { LocalFileStorage } from '@/infrastructure/file-storage/LocalFileStorage';

import { PrismaOrderRepository } from '@/infrastructure/database/PrismaOrderRepository';
import { PrismaCustomerRepository } from '@/infrastructure/database/PrismaCustomerRepository';

export function createOrdersRouter(prisma: PrismaClient): Router {
  const router = Router();
  const orderRepo = new PrismaOrderRepository(prisma);
  const customerRepo = new PrismaCustomerRepository(prisma);
  const attachmentRepo = new PrismaOrderAttachmentRepository(prisma);
  const fileStorage = new LocalFileStorage();

  const listUseCase = new ListOrdersUseCase(orderRepo);
  const createUseCase = new CreateOrderUseCase(customerRepo, orderRepo);
  const getUseCase = new GetOrderUseCase(orderRepo);
  const updateUseCase = new UpdateOrderUseCase(orderRepo);
  const changeStatusUseCase = new ChangeOrderStatusUseCase(orderRepo);
  const cancelUseCase = new CancelOrderUseCase(orderRepo);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { page, pageSize, customerId, status, startDate, endDate, orderNumber } = req.query;
      const result = await listUseCase.execute({
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 25,
        customerId: (customerId as string) || undefined,
        status: (status as any) || undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        orderNumber: (orderNumber as string) || undefined,
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro interno' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      const result = await getUseCase.execute(id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Não encontrado' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const body = {
        ...req.body,
        dueDate: req.body.deadline ? new Date(req.body.deadline) : new Date(),
      };
      const result = await createUseCase.execute(body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar' });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      const body = {
        ...req.body,
        dueDate: req.body.deadline ? new Date(req.body.deadline) : undefined,
      };
      const result = await updateUseCase.execute(id, body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao atualizar' });
    }
  });

  router.post('/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      const { status } = req.body;
      const result = await changeStatusUseCase.execute(id, status);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao mudar status' });
    }
  });

  router.post('/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      const { reason } = req.body;
      const result = await cancelUseCase.execute(id, reason);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao cancelar' });
    }
  });

  // Configuração Multer para anexos (usando buffer para validação MIME real no use case)
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  const uploadAttachmentUseCase = new UploadOrderAttachmentUseCase(attachmentRepo, fileStorage);
  const listAttachmentsUseCase = new ListOrderAttachmentsUseCase(attachmentRepo);
  const downloadAttachmentUseCase = new DownloadOrderAttachmentUseCase(attachmentRepo, fileStorage);
  const deleteAttachmentUseCase = new DeleteOrderAttachmentUseCase(attachmentRepo);
  
  const attachmentController = new OrderAttachmentController(
    uploadAttachmentUseCase,
    listAttachmentsUseCase,
    downloadAttachmentUseCase,
    deleteAttachmentUseCase
  );

  router.post('/:id/attachments', upload.single('file'), (req, res) => attachmentController.upload(req, res));
  router.get('/:id/attachments', (req, res) => attachmentController.list(req, res));
  router.get('/:id/attachments/:fileId', (req, res) => attachmentController.download(req, res));
  router.delete('/:id/attachments/:fileId', (req, res) => attachmentController.delete(req, res));

  router.get('/:id/print-jobs', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      const result = await orderRepo.listPrintJobs(id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao listar impressões' });
    }
  });

  router.post('/:id/print-jobs', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      const { printerId, quality, colorProfile, paperTypeId, pagesBlackAndWhite, pagesColor } = req.body;
      
      const result = await prisma.printJob.create({
        data: {
          orderId: id,
          printerId: printerId as string,
          quality: quality as any,
          colorProfile: colorProfile as any,
          paperTypeId: paperTypeId as string || null,
          pagesBlackAndWhite: Number(pagesBlackAndWhite) || 0,
          pagesColor: Number(pagesColor) || 0,
          registeredCost: 0,
          paperWeight: 0
        }
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar impressão' });
    }
  });

  return router;
}
