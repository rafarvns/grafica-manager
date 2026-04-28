import { OrderStatus, ChangeStatusOutput } from '@/application/dtos/OrderStatusDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderStatusHistory } from '@/domain/entities/OrderStatusHistory';

export interface INotificationService {
  sendInfo(title: string, description: string, extras?: any): Promise<any>;
}

export class ChangeOrderStatusUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private notificationService?: INotificationService
  ) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<ChangeStatusOutput> {
    // Bloquear transição para cancelado (deve usar CancelOrderUseCase)
    if (newStatus === 'cancelled') {
      throw new Error('Use CancelOrderUseCase para cancelar pedidos');
    }

    // Verificar se pedido existe
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const oldStatus = order.status;

    // Aplicar mudança de status no domínio (valida regras)
    order.changeStatus(newStatus);

    // Registrar mudança no histórico
    const historyEntry = OrderStatusHistory.create({
      orderId,
      fromStatus: oldStatus,
      toStatus: newStatus,
    });

    // Atualizar status no repositório (deve lidar com o histórico em transação se possível)
    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      newStatus,
      historyEntry.toJSON() as any
    );

    // Notificar mudança de status
    if (this.notificationService) {
      await this.notificationService.sendInfo(
        'Status do Pedido Atualizado',
        `O pedido #${order.orderNumber} mudou de ${oldStatus} para ${newStatus}.`,
        { orderId, actionUrl: `/orders/${orderId}` }
      );
    }

    // Buscar histórico atualizado para o retorno
    const history = await this.orderRepository.findStatusHistory(orderId);

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      statusHistory: history.map((h: any) => h.toJSON ? h.toJSON() : h),
    };
  }
}
