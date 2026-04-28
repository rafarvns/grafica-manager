import { UpdateOrderInput, UpdateOrderOutput } from '@/application/dtos/UpdateOrderDTO';

export interface IOrderRepository {
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<UpdateOrderOutput>;
}

export class UpdateOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, input: UpdateOrderInput): Promise<UpdateOrderOutput> {
    // Verificar se pedido existe
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Bloquear edição se pedido está em shipping
    if (order.status === 'shipping') {
      throw new Error('Pedido em shipping não pode ser editado');
    }

    // Bloquear edição se pedido está cancelado
    if (order.status === 'cancelled') {
      throw new Error('Pedido cancelado não pode ser editado');
    }

    const updateData: any = {};

    // Validar e adicionar quantidade se fornecida
    if (input.quantity !== undefined) {
      if (input.quantity <= 0) {
        throw new Error('Quantidade deve ser maior que 0');
      }
      updateData.quantity = input.quantity;
    }

    // Validar e adicionar preço de venda se fornecido
    if (input.salePrice !== undefined) {
      if (input.salePrice < 0) {
        throw new Error('Preço de venda não pode ser negativo');
      }
      updateData.salePrice = input.salePrice;
    }

    // Validar e adicionar custo de produção se fornecido
    if (input.productionCost !== undefined) {
      if (input.productionCost < 0) {
        throw new Error('Custo de produção não pode ser negativo');
      }
      updateData.productionCost = input.productionCost;
    }

    // Adicionar outros campos se fornecidos
    if (input.description !== undefined) {
      updateData.description = input.description.trim();
    }

    if (input.paperTypeId !== undefined) {
      updateData.paperTypeId = input.paperTypeId;
    }

    if (input.width !== undefined) {
      updateData.width = input.width;
    }

    if (input.height !== undefined) {
      updateData.height = input.height;
    }

    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    // Atualizar pedido
    const updatedOrder = await this.orderRepository.update(orderId, updateData);

    return updatedOrder;
  }
}
