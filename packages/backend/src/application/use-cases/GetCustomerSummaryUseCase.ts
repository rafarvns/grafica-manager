import { GetCustomerSummaryOutput } from '@/application/dtos/CustomerSummaryDTO';

export interface ICustomerRepository {
  findById(id: string): Promise<any>;
}

export interface IOrderRepository {
  findByCustomerId(customerId: string): Promise<any[]>;
}

export interface IPrintJobRepository {
  findByOrderId(orderId: string): Promise<any[]>;
}

export class GetCustomerSummaryUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private orderRepository: IOrderRepository,
    private printJobRepository: IPrintJobRepository
  ) {}

  async execute(customerId: string): Promise<GetCustomerSummaryOutput> {
    // Buscar cliente
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    // Buscar todos os pedidos do cliente
    const orders = await this.orderRepository.findByCustomerId(customerId);

    // Agregar dados de todos os pedidos
    let totalSaleValue = 0;
    let totalPrintCost = 0;
    let totalPrintJobs = 0;
    let successfulPrintJobs = 0;
    let failedPrintJobs = 0;
    const ordersByStatus: Record<string, number> = {};

    const orderSummaries = [];

    for (const order of orders) {
      // Buscar impressões deste pedido
      const printJobs = await this.printJobRepository.findByOrderId(order.id);

      // Calcular custo total do pedido
      const orderTotalPrintCost = printJobs.reduce(
        (sum, job) => sum + (job.registeredCost || 0),
        0
      );

      orderSummaries.push({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        salePrice: order.salePrice,
        totalPrintCost: orderTotalPrintCost,
      });

      // Agregar no cliente
      totalSaleValue += order.salePrice;
      totalPrintCost += orderTotalPrintCost;
      totalPrintJobs += printJobs.length;

      successfulPrintJobs += printJobs.filter(
        (job) => job.status === 'sucesso'
      ).length;
      failedPrintJobs += printJobs.filter((job) => job.status === 'erro')
        .length;

      // Contar por status
      const status = order.status;
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    }

    const totalMargin = totalSaleValue - totalPrintCost;

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      orders: orderSummaries,
      totalOrders: orders.length,
      ordersByStatus,
      totalSaleValue,
      totalPrintCost,
      totalMargin,
      totalPrintJobs,
      successfulPrintJobs,
      failedPrintJobs,
    };
  }
}
