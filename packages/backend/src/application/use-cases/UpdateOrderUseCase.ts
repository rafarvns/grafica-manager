import { UpdateOrderInput, UpdateOrderOutput } from '@/application/dtos/UpdateOrderDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';

export class UpdateOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(orderId: string, input: UpdateOrderInput): Promise<UpdateOrderOutput> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Aplicar atualizações no domínio (valida regras)
    order.update({
      description: input.description,
      quantity: input.quantity,
      paperTypeId: input.paperTypeId,
      width: input.width,
      height: input.height,
      dueDate: input.dueDate,
      salePrice: input.salePrice,
      productionCost: input.productionCost,
      notes: input.notes,
    });

    // Persistir mudanças
    const updatedOrder = await this.orderRepository.update(order);

    return updatedOrder.toJSON() as any;
  }
}
