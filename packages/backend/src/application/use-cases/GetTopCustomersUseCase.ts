import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';
import { TopCustomerEntry } from '@/application/dtos/MetricsDTO';

export interface ITopCustomersRepository {
  getTopCustomersByRevenue(from: Date, to: Date, limit: number): Promise<TopCustomerEntry[]>;
}

export interface GetTopCustomersInput {
  period: PeriodFilter;
  limit?: number;
}

const DEFAULT_LIMIT = 5;

export class GetTopCustomersUseCase {
  constructor(private metricsRepository: ITopCustomersRepository) {}

  async execute(input: GetTopCustomersInput): Promise<TopCustomerEntry[]> {
    const { period, limit = DEFAULT_LIMIT } = input;
    return this.metricsRepository.getTopCustomersByRevenue(period.from, period.to, limit);
  }
}
