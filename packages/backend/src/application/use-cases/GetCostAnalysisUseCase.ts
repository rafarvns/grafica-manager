import { PeriodFilter } from '@/domain/value-objects/PeriodFilter';
import { CostAnalysisOutput } from '@/application/dtos/MetricsDTO';

export interface ICostAnalysisRepository {
  sumRevenueInPeriod(from: Date, to: Date): Promise<number>;
  sumCostInPeriod(from: Date, to: Date): Promise<number>;
}

export interface GetCostAnalysisInput {
  period: PeriodFilter;
}

export class GetCostAnalysisUseCase {
  constructor(private metricsRepository: ICostAnalysisRepository) {}

  async execute(input: GetCostAnalysisInput): Promise<CostAnalysisOutput> {
    const { from, to } = input.period;

    const [revenue, cost] = await Promise.all([
      this.metricsRepository.sumRevenueInPeriod(from, to),
      this.metricsRepository.sumCostInPeriod(from, to),
    ]);

    const grossMargin = revenue - cost;
    const grossMarginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

    return { revenue, cost, grossMargin, grossMarginPercent };
  }
}
