import {
  ListCustomersInput,
  ListCustomersOutput,
  CustomerListItem,
} from '@/application/dtos/ListCustomersDTO';

export interface ICustomerRepository {
  findWithFilters(filters: any): Promise<CustomerListItem[]>;
  countWithFilters(filters: any): Promise<number>;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export class ListCustomersUseCase {
  constructor(private customerRepository: ICustomerRepository) {}

  async execute(input: ListCustomersInput): Promise<ListCustomersOutput> {
    const page = input.page || 1;
    const pageSize = Math.min(input.pageSize || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const skip = (page - 1) * pageSize;

    const filters: any = {
      skip,
      take: pageSize,
      deletedAt: null, // Sempre excluir clientes deletados
    };

    if (input.name) {
      filters.name = input.name;
    }

    if (input.email) {
      filters.email = input.email;
    }

    if (input.city) {
      filters.city = input.city;
    }

    const data = await this.customerRepository.findWithFilters(filters);
    const total = await this.customerRepository.countWithFilters(filters);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }
}
