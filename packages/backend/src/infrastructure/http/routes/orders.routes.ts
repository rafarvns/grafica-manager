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

function mapOrder(item: any) {
  return {
    ...item,
    customerId: item.customerId || '',
    paperTypeId: item.paperTypeId || '',
    width: item.width ? Number(item.width) : 0,
    height: item.height ? Number(item.height) : 0,
    dueDate: item.dueDate || new Date(),
    deadline: item.dueDate || new Date(), // Para compatibilidade com frontend
    salePrice: Number(item.salePrice),
    productionCost: Number(item.productionCost),
    position: item.position || 0,
  };
}

function buildOrderRepository(prisma: PrismaClient) {
  return {
    async findWithFilters(filters: any) {
      const items = await prisma.order.findMany({
        where: {
          deletedAt: null,
          ...(filters.customerId && { customerId: filters.customerId }),
          ...(filters.status && { status: filters.status }),
          ...(filters.orderNumber && { orderNumber: { contains: filters.orderNumber } }),
          ...(filters.startDate && filters.endDate && {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
        },
        skip: filters.skip,
        take: filters.take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true }
          }
        }
      });
      return items.map(mapOrder);
    },
    async countWithFilters(filters: any) {
      return prisma.order.count({
        where: {
          deletedAt: null,
          ...(filters.customerId && { customerId: filters.customerId }),
          ...(filters.status && { status: filters.status }),
          ...(filters.orderNumber && { orderNumber: { contains: filters.orderNumber } }),
          ...(filters.startDate && filters.endDate && {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
        },
      });
    },
    async findById(id: string) {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          files: true,
          customer: true
        }
      });
      if (!order) return null;
      return mapOrder(order);
    },
    async create(data: any) {
      const count = await prisma.order.count();
      const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
      
      const order = await prisma.order.create({
        data: {
          ...data,
          orderNumber
        }
      });
      return {
        ...mapOrder(order),
        status: 'draft' as const // Forçar tipo literal para satisfazer DTO
      };
    },
    async update(id: string, data: any) {
      const order = await prisma.order.update({
        where: { id },
        data
      });
      return mapOrder(order);
    },
    async updateStatus(id: string, status: any, historyEntry: any) {
      return prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id } });
        if (!current) throw new Error('Pedido não encontrado');

        const order = await tx.order.update({
          where: { id },
          data: { status }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: historyEntry.fromStatus,
            toStatus: historyEntry.toStatus,
            reason: historyEntry.reason || 'Mudança manual'
          }
        });

        const updated = await tx.order.findUnique({
          where: { id },
          include: { statusHistory: true }
        });
        if (!updated) throw new Error('Falha ao recuperar pedido atualizado');
        return mapOrder(updated);
      });
    },
    async cancel(id: string, reason: string, _timestamp: Date) {
      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id } });
        if (!order) throw new Error('Pedido não encontrado');

        await tx.order.update({
          where: { id },
          data: { status: 'cancelled' }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: order.status,
            toStatus: 'cancelled',
            reason: reason
          }
        });

        const final = await tx.order.findUnique({
          where: { id },
          include: { statusHistory: true }
        });
        if (!final) throw new Error('Falha ao recuperar pedido cancelado');
        return mapOrder(final);
      });
    },
    async listPrintJobs(orderId: string) {
      return prisma.printJob.findMany({
        where: { orderId },
        include: { printer: true, paper: true }
      });
    },
    async addAttachment(orderId: string, file: { name: string; path: string; size: number; mimeType: string }) {
      return prisma.orderFile.create({
        data: {
          orderId,
          ...file
        }
      });
    },
    async removeAttachment(orderId: string, fileId: string) {
      // Nota: em produção também removeria do disco
      return prisma.orderFile.delete({
        where: { id: fileId, orderId }
      });
    }
  };
}

function buildCustomerRepository(prisma: PrismaClient) {
  return {
    async findById(id: string) {
      return prisma.customer.findUnique({ where: { id } });
    }
  };
}

export function createOrdersRouter(prisma: PrismaClient): Router {
  const router = Router();
  const orderRepo = buildOrderRepository(prisma);
  const customerRepo = buildCustomerRepository(prisma);

  const listUseCase = new ListOrdersUseCase(orderRepo as any);
  const createUseCase = new CreateOrderUseCase(customerRepo, orderRepo as any);
  const getUseCase = new GetOrderUseCase(orderRepo as any);
  const updateUseCase = new UpdateOrderUseCase(orderRepo as any);
  const changeStatusUseCase = new ChangeOrderStatusUseCase(orderRepo as any);
  const cancelUseCase = new CancelOrderUseCase(orderRepo as any);

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

  // Configuração Multer para anexos
  const upload = multer({ dest: 'uploads/orders/' });

  router.post('/:id/attachments', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) throw new Error('ID não fornecido');
      if (!req.file) throw new Error('Arquivo não enviado');
      
      const fileData = {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype
      };

      const result = await orderRepo.addAttachment(id, fileData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao adicionar anexo' });
    }
  });

  router.delete('/:id/attachments/:fileId', async (req: Request, res: Response) => {
    try {
      const { id, fileId } = req.params;
      if (!id || !fileId) throw new Error('IDs não fornecidos');
      await orderRepo.removeAttachment(id, fileId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao remover anexo' });
    }
  });

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
