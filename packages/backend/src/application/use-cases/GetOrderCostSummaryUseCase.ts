import { GetOrderCostSummaryOutput } from '@/application/dtos/OrderCostSummaryDTO';

export interface IOrderRepository {
  findById(id: string): Promise<any>;
}

export interface IPrintJobRepository {
  findByOrderId(orderId: string): Promise<any[]>;
}

export class GetOrderCostSummaryUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private printJobRepository: IPrintJobRepository
  ) {}

  async execute(orderId: string): Promise<GetOrderCostSummaryOutput> {
    // Buscar pedido
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Buscar todas as impressões do pedido
    const printJobs = await this.printJobRepository.findByOrderId(orderId);

    // Calcular custos (soma de snapshots imutáveis)
    const totalPrintCost = printJobs.reduce(
      (sum, job) => sum + (job.registeredCost || 0),
      0
    );

    // Contar impressões
    const printJobCount = printJobs.length;
    const successfulPrintCount = printJobs.filter(
      (job) => job.status === 'sucesso'
    ).length;
    const failedPrintCount = printJobs.filter(
      (job) => job.status === 'erro'
    ).length;

    // Calcular margem
    const margin = order.salePrice - totalPrintCost;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      salePrice: order.salePrice,
      status: order.status,
      totalPrintCost,
      printJobCount,
      successfulPrintCount,
      failedPrintCount,
      margin,
    };
  }
}
