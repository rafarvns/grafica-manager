import {
  DeleteCustomerOutput,
  RestoreCustomerOutput,
} from '@/application/dtos/DeleteCustomerDTO';

export interface ICustomerRepository {
  findById(id: string): Promise<any>;
  softDelete(id: string): Promise<any>;
  restore(id: string): Promise<any>;
}

export interface IOrderRepository {
  countActiveByCustomerId(customerId: string): Promise<number>;
}

export class DeleteCustomerUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(customerId: string): Promise<DeleteCustomerOutput> {
    // Verificar se cliente existe
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    // Verificar se cliente tem pedidos ativos
    const activeOrderCount = await this.orderRepository.countActiveByCustomerId(
      customerId
    );
    if (activeOrderCount > 0) {
      throw new Error(
        `Cliente possui ${activeOrderCount} pedidos ativos. Conclua ou cancele os pedidos antes de deletar.`
      );
    }

    // Executar soft-delete
    const deletedCustomer = await this.customerRepository.softDelete(customerId);

    return {
      success: true,
      customerName: customer.name,
      deletedAt: deletedCustomer.deletedAt,
    };
  }

  async restore(customerId: string): Promise<RestoreCustomerOutput> {
    // Verificar se cliente existe
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    // Verificar se cliente foi deletado
    if (!customer.deletedAt) {
      throw new Error('Cliente não foi deletado');
    }

    // Restaurar cliente
    const restoredCustomer = await this.customerRepository.restore(customerId);

    return {
      id: restoredCustomer.id,
      name: restoredCustomer.name,
      email: restoredCustomer.email,
      deletedAt: null,
    };
  }
}
