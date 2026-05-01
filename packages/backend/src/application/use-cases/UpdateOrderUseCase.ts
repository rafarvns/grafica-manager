import { UpdateOrderInput, UpdateOrderOutput } from '@/application/dtos/UpdateOrderDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';

export class UpdateOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(orderId: string, input: UpdateOrderInput): Promise<UpdateOrderOutput> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    order.update({
      description: input.description,
      quantity: input.quantity,
      priceTableEntryId: input.priceTableEntryId,
      dueDate: input.dueDate,
      salePrice: input.salePrice,
      notes: input.notes,
    });

    const updatedOrder = await this.orderRepository.update(order);

    return updatedOrder.toJSON() as any;
  }
}
