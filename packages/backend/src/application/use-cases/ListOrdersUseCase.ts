import {
  ListOrdersInput,
  ListOrdersOutput,
  OrderListItem,
} from '@/application/dtos/ListOrdersDTO';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { OrderStatus } from '@grafica/shared';

const VALID_STATUSES: OrderStatus[] = [
  'draft',
  'scheduled',
  'in_production',
  'completed',
  'shipping',
  'cancelled',
];

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export class ListOrdersUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(input: ListOrdersInput): Promise<ListOrdersOutput> {
    // Validar período
    if (input.startDate && input.endDate) {
      if (input.startDate > input.endDate) {
        throw new Error('startDate não pode ser posterior a endDate');
      }
    }

    // Validar status
    if (input.status && !VALID_STATUSES.includes(input.status as OrderStatus)) {
      throw new Error('Status inválido');
    }

    const page = input.page || 1;
    const pageSize = Math.min(input.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const filters = {
      skip,
      take: pageSize,
      customerId: input.customerId,
      status: input.status as OrderStatus,
      startDate: input.startDate,
      endDate: input.endDate,
      orderNumber: input.orderNumber,
    };

    const orders = await this.orderRepository.findWithFilters(filters);
    const total = await this.orderRepository.countWithFilters(filters);

    return {
      data: orders.map(order => order.toJSON()) as any[],
      total,
      page,
      pageSize,
    };
  }
}
