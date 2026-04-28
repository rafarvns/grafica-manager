import { GetOrderOutput } from '@/application/dtos/OrderStatusDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';

export class GetOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(orderId: string): Promise<GetOrderOutput> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const history = await this.orderRepository.findStatusHistory(orderId);

    const data = order.toJSON();

    return {
      id: data.id,
      orderNumber: data.orderNumber,
      customerId: data.customerId ?? undefined,
      description: data.description,
      quantity: data.quantity,
      paperTypeId: data.paperTypeId ?? undefined,
      width: data.width ?? undefined,
      height: data.height ?? undefined,
      dueDate: data.dueDate ?? undefined,
      salePrice: data.salePrice,
      productionCost: data.productionCost,
      status: data.status,
      notes: data.notes ?? undefined,
      statusHistory: history.map((h: any) => h.toJSON ? h.toJSON() : h),
      createdAt: data.createdAt,
    } as GetOrderOutput;
  }
}
