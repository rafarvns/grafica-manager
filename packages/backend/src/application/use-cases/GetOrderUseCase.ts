import { GetOrderOutput } from '@/application/dtos/OrderStatusDTO';

export interface IOrderRepository {
  findById(id: string): Promise<any>;
}

export class GetOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string): Promise<GetOrderOutput> {
    // Buscar pedido por ID
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      description: order.description,
      quantity: order.quantity,
      paperTypeId: order.paperTypeId,
      width: order.width,
      height: order.height,
      dueDate: order.dueDate,
      salePrice: order.salePrice,
      productionCost: order.productionCost,
      status: order.status,
      notes: order.notes,
      statusHistory: order.statusHistory || [],
      cancellationReason: order.cancellationReason,
      cancellationTime: order.cancellationTime,
      createdAt: order.createdAt,
    };
  }
}
