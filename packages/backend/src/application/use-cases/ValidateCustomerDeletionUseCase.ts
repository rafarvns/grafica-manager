import { CustomerDeletionValidationOutput } from '@/application/dtos/DeletionValidationDTO';

export interface ICustomerRepository {
  findById(id: string): Promise<any>;
}

export interface IOrderRepository {
  countActiveByCustomerId(customerId: string): Promise<number>;
}

export class ValidateCustomerDeletionUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(customerId: string): Promise<CustomerDeletionValidationOutput> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    const activeOrderCount = await this.orderRepository.countActiveByCustomerId(customerId);

    if (activeOrderCount > 0) {
      throw new Error(`Cliente possui ${activeOrderCount} pedidos ativos`);
    }

    return {
      canDelete: true,
      reason: null,
      activeOrderCount: 0,
    };
  }
}
