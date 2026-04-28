export type PeriodPreset = 'today' | 'lastSevenDays' | 'thisWeek' | 'thisMonth' | 'custom';

export class PeriodFilter {
  private constructor(
    readonly from: Date,
    readonly to: Date,
    readonly preset: PeriodPreset
  ) {}

  static today(): PeriodFilter {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return new PeriodFilter(from, to, 'today');
  }

  static thisWeek(): PeriodFilter {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const from = new Date(now);
    from.setDate(now.getDate() + daysToMonday);
    from.setHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);

    return new PeriodFilter(from, to, 'thisWeek');
  }

  static thisMonth(): PeriodFilter {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return new PeriodFilter(from, to, 'thisMonth');
  }

  static lastSevenDays(): PeriodFilter {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date(to);
    from.setDate(to.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return new PeriodFilter(from, to, 'lastSevenDays');
  }

  static custom(from: Date, to: Date): PeriodFilter {
    if (from > to) {
      throw new Error('Data inicial deve ser anterior ou igual à data final');
    }
    return new PeriodFilter(from, to, 'custom');
  }

  getDays(): number {
    const fromMidnight = new Date(this.from);
    fromMidnight.setHours(0, 0, 0, 0);
    const toMidnight = new Date(this.to);
    toMidnight.setHours(0, 0, 0, 0);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / msPerDay) + 1;
  }

  contains(date: Date): boolean {
    return date >= this.from && date <= this.to;
  }
}
