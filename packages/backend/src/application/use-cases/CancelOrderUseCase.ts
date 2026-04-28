import { CancelOrderOutput } from '@/application/dtos/OrderStatusDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';

export class CancelOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(orderId: string, reason: string): Promise<CancelOrderOutput> {
    // Validar motivo obrigatório
    if (!reason || reason.trim().length === 0) {
      throw new Error('Motivo de cancelamento é obrigatório');
    }

    // Verificar se pedido existe
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Aplicar cancelamento no domínio (valida regras)
    const result = order.cancel(reason.trim());

    // Executar cancelamento no repositório (com histórico e transação)
    const cancelledOrder = await this.orderRepository.cancel(
      orderId,
      reason.trim(),
      result
    );

    const history = await this.orderRepository.findStatusHistory(orderId);

    return {
      id: cancelledOrder.id,
      status: 'cancelled',
      cancellationReason: reason.trim(),
      cancellationTime: new Date(), // Idealmente viria do histórico
      statusHistory: history.map((h: any) => h.toJSON ? h.toJSON() : h),
    };
  }
}
