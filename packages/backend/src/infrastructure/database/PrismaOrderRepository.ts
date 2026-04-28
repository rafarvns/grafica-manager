import { PrismaClient } from '@prisma/client';
import { OrderRepository, OrderFilters } from '@/domain/repositories/OrderRepository';
import { Order } from '@/domain/entities/Order';
import { OrderStatus } from '@grafica/shared';

export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) return null;
    return this.mapToDomain(order);
  }

  async findWithFilters(filters: OrderFilters): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
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
      ...(filters.skip !== undefined && { skip: filters.skip }),
      ...(filters.take !== undefined && { take: filters.take }),
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(this.mapToDomain);
  }

  async countWithFilters(filters: OrderFilters): Promise<number> {
    return this.prisma.order.count({
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
  }

  async create(order: Order): Promise<Order> {
    const data = order.toJSON();
    const created = await this.prisma.order.create({
      data: {
        id: data.id,
        orderNumber: data.orderNumber,
        status: data.status,
        description: data.description,
        quantity: data.quantity,
        paperTypeId: data.paperTypeId ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        dueDate: data.dueDate ?? null,
        shopeeOrderId: data.shopeeOrderId ?? null,
        shopeeShopId: data.shopeeShopId ?? null,
        salePrice: data.salePrice,
        productionCost: data.productionCost,
        notes: data.notes ?? null,
        customerId: data.customerId ?? null,
        storeId: data.storeId ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToDomain(created);
  }

  async update(order: Order): Promise<Order> {
    const data = order.toJSON();
    const updated = await this.prisma.order.update({
      where: { id: data.id },
      data: {
        status: data.status,
        description: data.description,
        quantity: data.quantity,
        paperTypeId: data.paperTypeId ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        dueDate: data.dueDate ?? null,
        salePrice: data.salePrice,
        productionCost: data.productionCost,
        notes: data.notes ?? null,
        customerId: data.customerId ?? null,
        updatedAt: new Date(),
        deletedAt: data.deletedAt ?? null,
      },
    });

    return this.mapToDomain(updated);
  }

  async updateStatus(id: string, status: OrderStatus, historyEntry: { fromStatus: OrderStatus | null, toStatus: OrderStatus, reason?: string }): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: historyEntry.fromStatus,
          toStatus: historyEntry.toStatus,
          reason: historyEntry.reason || 'Mudança manual',
        },
      });

      return this.mapToDomain(updated);
    });
  }

  async cancel(id: string, reason: string, history: { fromStatus: string; toStatus: string; reason: string }): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        statusHistory: {
          create: {
            fromStatus: history.fromStatus,
            toStatus: history.toStatus,
            reason: history.reason,
          },
        },
      },
    });
    return this.mapToDomain(updatedOrder);
  }

  async findStatusHistory(orderId: string): Promise<any[]> {
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPrintJobs(orderId: string): Promise<any[]> {
    return this.prisma.printJob.findMany({
      where: { orderId },
      include: { printer: true, paper: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToDomain(order: any): Order {
    return new Order({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      description: order.description,
      quantity: order.quantity,
      paperTypeId: order.paperTypeId,
      width: order.width ? Number(order.width) : null,
      height: order.height ? Number(order.height) : null,
      dueDate: order.dueDate,
      shopeeOrderId: order.shopeeOrderId,
      shopeeShopId: order.shopeeShopId,
      salePrice: Number(order.salePrice),
      productionCost: Number(order.productionCost),
      customerId: order.customerId,
      storeId: order.storeId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deletedAt: order.deletedAt,
    });
  }
}
