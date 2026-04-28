import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ListCustomersUseCase } from '@/application/use-cases/ListCustomersUseCase';
import { CreateCustomerUseCase } from '@/application/use-cases/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '@/application/use-cases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '@/application/use-cases/DeleteCustomerUseCase';
import { GetCustomerUseCase } from '@/application/use-cases/GetCustomerUseCase';

function buildCustomerRepository(prisma: PrismaClient) {
  return {
    async findWithFilters(filters: any) {
      const items = await prisma.customer.findMany({
        where: {
          deletedAt: null,
          ...(filters.name && { name: { contains: filters.name } }),
          ...(filters.email && { email: { contains: filters.email } }),
          ...(filters.city && { city: { contains: filters.city } }),
        },
        skip: filters.skip,
        take: filters.take,
        orderBy: { name: 'asc' },
      });
      return items.map(item => ({
        ...item,
        email: item.email || '',
        phone: item.phone || null,
        city: item.city || null,
        state: item.state || null,
      }));
    },
    async countWithFilters(filters: any) {
      return prisma.customer.count({
        where: {
          deletedAt: null,
          ...(filters.name && { name: { contains: filters.name } }),
          ...(filters.email && { email: { contains: filters.email } }),
          ...(filters.city && { city: { contains: filters.city } }),
        },
      });
    },
    async findByEmail(email: string) {
      return prisma.customer.findFirst({ where: { email, deletedAt: null } });
    },
    async findById(id: string) {
      return prisma.customer.findUnique({ where: { id } });
    },
    async create(data: any) {
      const customer = await prisma.customer.create({ data });
      return {
        ...customer,
        email: customer.email || '',
        phone: customer.phone || null,
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        zipCode: customer.zipCode || null,
        notes: customer.notes || null,
      };
    },
    async update(id: string, data: any) {
      const customer = await prisma.customer.update({ where: { id }, data });
      return {
        ...customer,
        email: customer.email || '',
        phone: customer.phone || null,
        address: customer.address || null,
        city: customer.city || null,
        state: customer.state || null,
        zipCode: customer.zipCode || null,
        notes: customer.notes || null,
      };
    },
    async softDelete(id: string) {
      return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    },
    async restore(id: string) {
      return prisma.customer.update({ where: { id }, data: { deletedAt: null } });
    }
  };
}

function buildOrderRepository(prisma: PrismaClient) {
  return {
    async countActiveByCustomerId(customerId: string) {
      return prisma.order.count({
        where: {
          customerId,
          status: { in: ['draft', 'scheduled', 'in_production'] },
          deletedAt: null,
        },
      });
    },
    async getOrderSummaryByCustomerId(customerId: string) {
      const orders = await prisma.order.findMany({
        where: { customerId, deletedAt: null },
        select: { status: true, salePrice: true },
      });
      return {
        total: orders.length,
        active: orders.filter(o => ['draft', 'scheduled', 'in_production'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        totalValue: orders.reduce((acc, o) => acc + Number(o.salePrice || 0), 0),
      };
    }
  };
}

export function createCustomersRouter(prisma: PrismaClient): Router {
  const router = Router();
  const customerRepo = buildCustomerRepository(prisma);
  const orderRepo = buildOrderRepository(prisma);

  const listUseCase = new ListCustomersUseCase(customerRepo);
  const createUseCase = new CreateCustomerUseCase(customerRepo);
  const updateUseCase = new UpdateCustomerUseCase(customerRepo);
  const deleteUseCase = new DeleteCustomerUseCase(customerRepo, orderRepo);
  const getUseCase = new GetCustomerUseCase(customerRepo, orderRepo);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { page, pageSize, name, email, city } = req.query;
      const result = await listUseCase.execute({
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10, // Use 10 as default if undefined
        name: name as string,
        email: email as string,
        city: city as string,
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro interno' });
    }
  });

  router.get('/check-email', async (req: Request, res: Response) => {
    try {
      const { email, excludeId } = req.query;
      if (!email) {
        res.json(true);
        return;
      }
      
      const existing = await customerRepo.findByEmail(email as string);
      if (!existing) {
        res.json(true);
        return;
      }
      
      if (excludeId && existing.id === excludeId) {
        res.json(true);
        return;
      }
      
      res.json(false);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao verificar email' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      if (!req.params.id) throw new Error('ID não fornecido');
      const result = await getUseCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Não encontrado' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      const result = await createUseCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar' });
    }
  });

  router.put('/:id', async (req: Request, res: Response) => {
    try {
      if (!req.params.id) throw new Error('ID não fornecido');
      const result = await updateUseCase.execute({ ...req.body, id: req.params.id });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao atualizar' });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      if (!req.params.id) throw new Error('ID não fornecido');
      const result = await deleteUseCase.execute(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao deletar' });
    }
  });

  return router;
}
