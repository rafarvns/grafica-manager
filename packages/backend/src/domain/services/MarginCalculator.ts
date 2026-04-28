export class MarginCalculator {
  static grossMarginPercent(revenue: number, cost: number): number {
    if (revenue === 0) return 0;
    return Math.round(((revenue - cost) / revenue) * 100 * 100) / 100;
  }

  static netMarginPercent(revenue: number, totalCost: number): number {
    return MarginCalculator.grossMarginPercent(revenue, totalCost);
  }
}
