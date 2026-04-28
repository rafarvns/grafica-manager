import { CreateOrderInput, CreateOrderOutput } from '@/application/dtos/CreateOrderDTO';

export interface ICustomerRepository {
  findById(id: string): Promise<any>;
}

export interface IOrderRepository {
  create(data: any): Promise<CreateOrderOutput>;
}

export class CreateOrderUseCase {
  constructor(
    private customerRepository: ICustomerRepository,
    private orderRepository: IOrderRepository
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

    // Criar pedido com status draft por padrão
    const order = await this.orderRepository.create({
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

    return order;
  }
}
