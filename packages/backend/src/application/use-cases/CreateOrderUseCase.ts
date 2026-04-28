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
    // Validar quantidade
    if (input.quantity <= 0) {
      throw new Error('Quantidade deve ser maior que 0');
    }

    // Validar preço de venda
    if (input.salePrice < 0) {
      throw new Error('Preço de venda não pode ser negativo');
    }

    // Validar custo de produção
    if (input.productionCost < 0) {
      throw new Error('Custo de produção não pode ser negativo');
    }

    // Validar descrição
    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }

    // Verificar cliente existe
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    // Criar pedido no domínio
    const order = Order.create({
      orderNumber: 'PENDING', // O repositório vai gerar o número real se necessário, ou passamos um temporário
      customerId: input.customerId,
      description: input.description.trim(),
      quantity: input.quantity,
      paperTypeId: input.paperTypeId,
      width: input.width,
      height: input.height,
      dueDate: input.dueDate,
      salePrice: input.salePrice,
      productionCost: input.productionCost,
      notes: input.notes || null,
      status: 'draft',
    });

    const createdOrder = await this.orderRepository.create(order);

    return createdOrder.toJSON() as any;
  }
}
