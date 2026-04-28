import {
  ListOrdersInput,
  ListOrdersOutput,
  OrderStatus,
  OrderListItem,
} from '@/application/dtos/ListOrdersDTO';

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

export interface IOrderRepository {
  findWithFilters(filters: any): Promise<OrderListItem[]>;
  countWithFilters(filters: any): Promise<number>;
}

export class ListOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(input: ListOrdersInput): Promise<ListOrdersOutput> {
    // Validar período
    if (input.startDate && input.endDate) {
      if (input.startDate > input.endDate) {
        throw new Error('startDate não pode ser posterior a endDate');
      }
    }

    // Validar status
    if (input.status && !VALID_STATUSES.includes(input.status)) {
      throw new Error('Status inválido');
    }

    const page = input.page || 1;
    const pageSize = Math.min(input.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const filters: any = {
      skip,
      take: pageSize,
    };

    if (input.customerId) {
      filters.customerId = input.customerId;
    }

    if (input.status) {
      filters.status = input.status;
    }

    if (input.startDate) {
      filters.startDate = input.startDate;
    }

    if (input.endDate) {
      filters.endDate = input.endDate;
    }

    if (input.orderNumber) {
      filters.orderNumber = input.orderNumber;
    }

    const data = await this.orderRepository.findWithFilters(filters);
    const total = await this.orderRepository.countWithFilters(filters);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }
}
