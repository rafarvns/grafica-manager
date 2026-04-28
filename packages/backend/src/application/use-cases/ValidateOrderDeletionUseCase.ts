import { OrderDeletionValidationOutput } from '@/application/dtos/DeletionValidationDTO';

export interface IOrderRepository {
  findById(id: string): Promise<any>;
}

export interface IPrintJobRepository {
  countInProgressByOrderId(orderId: string): Promise<number>;
}

export class ValidateOrderDeletionUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private printJobRepository: IPrintJobRepository
  ) {}

  async execute(orderId: string): Promise<OrderDeletionValidationOutput> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const inProgressCount = await this.printJobRepository.countInProgressByOrderId(orderId);

    if (inProgressCount > 0) {
      throw new Error(`Pedido possui ${inProgressCount} impressões em andamento`);
    }

    return {
      canDelete: true,
      reason: null,
      inProgressPrintJobCount: 0,
    };
  }
}
