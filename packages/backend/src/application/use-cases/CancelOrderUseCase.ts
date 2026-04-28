import { CancelOrderOutput } from '@/application/dtos/OrderStatusDTO';

export interface IOrderRepository {
  findById(id: string): Promise<any>;
  cancel(id: string, reason: string, timestamp: Date): Promise<any>;
}

export class CancelOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, reason: string): Promise<CancelOrderOutput> {
    // Verificar se pedido existe
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Validar motivo obrigatório
    if (!reason || reason.trim().length === 0) {
      throw new Error('Motivo de cancelamento é obrigatório');
    }

    // Bloquear cancelamento duplicado
    if (order.status === 'cancelled') {
      throw new Error('Pedido já está cancelado');
    }

    // Executar cancelamento
    const now = new Date();
    const cancelledOrder = await this.orderRepository.cancel(
      orderId,
      reason.trim(),
      now
    );

    return {
      id: cancelledOrder.id,
      status: 'cancelled',
      cancellationReason: cancelledOrder.cancellationReason,
      cancellationTime: cancelledOrder.cancellationTime,
      statusHistory: cancelledOrder.statusHistory,
    };
  }
}
