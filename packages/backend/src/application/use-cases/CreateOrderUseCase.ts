import { CreateOrderInput, CreateOrderOutput } from '@/application/dtos/CreateOrderDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { CustomerRepository } from '@/domain/repositories/CustomerRepository';
import { Order } from '@/domain/entities/Order';

export class CreateOrderUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private orderRepository: OrderRepository
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    if (input.quantity <= 0) {
      throw new Error('Quantidade deve ser maior que 0');
    }

    if (input.salePrice < 0) {
      throw new Error('Preço de venda não pode ser negativo');
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }

    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    const order = Order.create({
      orderNumber: 'PENDING',
      customerId: input.customerId,
      description: input.description.trim(),
      quantity: input.quantity,
      priceTableEntryId: input.priceTableEntryId ?? null,
      dueDate: input.dueDate,
      salePrice: input.salePrice,
      notes: input.notes || null,
      status: 'draft',
    });

    const createdOrder = await this.orderRepository.create(order);

    return createdOrder.toJSON() as any;
  }
}
