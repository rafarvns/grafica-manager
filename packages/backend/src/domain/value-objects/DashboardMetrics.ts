export interface TopCustomer {
  name: string;
  revenue: number;
}

export interface NewOrders {
  total: number;
  byOrigin: Record<string, number>;
}

export interface DashboardMetricsInput {
  printsTodayCount: number;
  openOrdersCount: number;
  revenue: number;
  cost: number;
  newOrders: NewOrders;
  topCustomer: TopCustomer | null;
  period: { from: Date; to: Date };
}

export class DashboardMetrics {
  readonly grossMarginPercent: number;

  private constructor(
    readonly printsTodayCount: number,
    readonly openOrdersCount: number,
    readonly revenue: number,
    readonly cost: number,
    readonly newOrders: NewOrders,
    readonly topCustomer: TopCustomer | null,
    readonly period: { from: Date; to: Date }
  ) {
    this.grossMarginPercent =
      revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  }

  static create(input: DashboardMetricsInput): DashboardMetrics {
    if (input.printsTodayCount < 0) {
      throw new Error('printsTodayCount não pode ser negativo');
    }
    if (input.openOrdersCount < 0) {
      throw new Error('openOrdersCount não pode ser negativo');
    }
    if (input.revenue < 0) {
      throw new Error('revenue não pode ser negativo');
    }
    if (input.cost < 0) {
      throw new Error('cost não pode ser negativo');
    }

    return new DashboardMetrics(
      input.printsTodayCount,
      input.openOrdersCount,
      input.revenue,
      input.cost,
      input.newOrders,
      input.topCustomer,
      input.period
    );
  }
}
