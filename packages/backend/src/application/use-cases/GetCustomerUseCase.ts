import { GetCustomerOutput } from '@/application/dtos/DeleteCustomerDTO';

export interface ICustomerRepository {
  findById(id: string): Promise<any>;
}

export interface IOrderRepository {
  getOrderSummaryByCustomerId(
    customerId: string
  ): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  }>;
}

export class GetCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(customerId: string): Promise<GetCustomerOutput> {
    // Buscar cliente por ID
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    // Buscar resumo de pedidos
    const orderSummary = await this.orderRepository.getOrderSummaryByCustomerId(
      customerId
    );

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      notes: customer.notes,
      createdAt: customer.createdAt,
      deletedAt: customer.deletedAt,
      orderSummary,
    };
  }
}
