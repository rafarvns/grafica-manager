import { OrderStatus, ChangeStatusOutput } from '@/application/dtos/OrderStatusDTO';

const VALID_STATUSES: OrderStatus[] = [
  'draft',
  'scheduled',
  'in_production',
  'completed',
  'shipping',
];

export interface IOrderRepository {
  findById(id: string): Promise<any>;
  updateStatus(id: string, status: OrderStatus, historyEntry: any): Promise<any>;
}

export class ChangeOrderStatusUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<ChangeStatusOutput> {
    // Verificar se pedido existe
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Bloquear transição para cancelado (deve usar CancelOrderUseCase)
    if (newStatus === 'cancelled') {
      throw new Error('Use CancelOrderUseCase para cancelar pedidos');
    }

    // Validar status é válido
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error('Status inválido');
    }

    // Bloquear mudança se pedido já está cancelado
    if (order.status === 'cancelled') {
      throw new Error('Pedido cancelado não pode mudar de status');
    }

    // Bloquear mudança de shipping para outro status
    if (order.status === 'shipping') {
      throw new Error('Pedido em shipping não pode mudar de status');
    }

    // Bloquear transição para mesmo status
    if (order.status === newStatus) {
      throw new Error(`Pedido já está em status ${newStatus}`);
    }

    // Registrar mudança no histórico
    const historyEntry = {
      fromStatus: order.status,
      toStatus: newStatus,
      timestamp: new Date(),
    };

    // Atualizar status
    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      newStatus,
      historyEntry
    );

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      statusHistory: updatedOrder.statusHistory,
    };
  }
}
