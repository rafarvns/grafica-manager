import { DashboardMetrics, TopCustomer, NewOrders } from '@/domain/value-objects/DashboardMetrics';
import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';

export interface IMetricsRepository {
  countPrintJobsInPeriod(from: Date, to: Date): Promise<number>;
  countOpenOrders(): Promise<number>;
  sumRevenueInPeriod(from: Date, to: Date): Promise<number>;
  sumCostInPeriod(from: Date, to: Date): Promise<number>;
  countNewOrdersByOriginInPeriod(from: Date, to: Date): Promise<NewOrders>;
  getTopCustomerInPeriod(from: Date, to: Date): Promise<TopCustomer | null>;
}

export interface GetDashboardMetricsInput {
  period: PeriodFilter;
}

export class GetDashboardMetricsUseCase {
  constructor(private metricsRepository: IMetricsRepository) {}

  async execute(input: GetDashboardMetricsInput): Promise<DashboardMetrics> {
    const { from, to } = input.period;

    const [
      printsTodayCount,
      openOrdersCount,
      revenue,
      cost,
      newOrders,
      topCustomer,
    ] = await Promise.all([
      this.metricsRepository.countPrintJobsInPeriod(from, to),
      this.metricsRepository.countOpenOrders(),
      this.metricsRepository.sumRevenueInPeriod(from, to),
      this.metricsRepository.sumCostInPeriod(from, to),
      this.metricsRepository.countNewOrdersByOriginInPeriod(from, to),
      this.metricsRepository.getTopCustomerInPeriod(from, to),
    ]);

    return DashboardMetrics.create({
      printsTodayCount,
      openOrdersCount,
      revenue,
      cost,
      newOrders,
      topCustomer,
      period: { from, to },
    });
  }
}
