import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaOrderRepository } from '@/infrastructure/database/PrismaOrderRepository';
import { Order } from '@/domain/entities/Order';
import { PrismaClient } from '@prisma/client';

describe('PrismaOrderRepository', () => {
  let repository: PrismaOrderRepository;
  let prisma: PrismaClient;

  const prismaMock = {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prismaMock)),
    printJob: {
      findMany: vi.fn(),
    }
  } as any;

  beforeEach(() => {
    prisma = prismaMock;
    repository = new PrismaOrderRepository(prisma);
    vi.clearAllMocks();
  });

  it('should create an order', async () => {
    const order = Order.create({
      orderNumber: 'ORD-0001',
      description: 'Test',
      quantity: 1,
      salePrice: 10,
      productionCost: 5,
      status: 'draft',
    });

    prismaMock.order.create.mockResolvedValue({
      ...order.toJSON(),
      salePrice: 10,
      productionCost: 5,
    });

    const result = await repository.create(order);
    expect(result.orderNumber).toBe('ORD-0001');
    expect(prismaMock.order.create).toHaveBeenCalled();
  });

  it('should update order status with history', async () => {
    const orderId = '123';
    prismaMock.order.update.mockResolvedValue({
      id: orderId,
      status: 'scheduled',
      salePrice: 10,
      productionCost: 5,
    });

    await repository.updateStatus(orderId, 'scheduled', {
      fromStatus: 'draft',
      toStatus: 'scheduled',
      reason: 'Testing',
    });

    expect(prismaMock.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: orderId },
      data: expect.objectContaining({ status: 'scheduled' }),
    }));
    expect(prismaMock.orderStatusHistory.create).toHaveBeenCalled();
  });
});
