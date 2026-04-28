import { useState, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';

export type PeriodPreset = 'today' | 'lastSevenDays' | 'thisWeek' | 'thisMonth' | 'custom';

export interface KpiMetrics {
  printsTodayCount: number;
  openOrdersCount: number;
  revenue: number;
  cost: number;
  grossMarginPercent: number;
  newOrders: { total: number; byOrigin: Record<string, number> };
  topCustomer: { name: string; revenue: number } | null;
  period: { from: string; to: string };
}

export interface TopCustomerEntry {
  customerId: string;
  name: string;
  revenue: number;
  orderCount: number;
}

export interface CostAnalysis {
  revenue: number;
  cost: number;
  grossMargin: number;
  grossMarginPercent: number;
}

export interface PrintTrendEntry {
  date: string;
  count: number;
}

export interface DashboardData {
  metrics: KpiMetrics;
  topCustomers: TopCustomerEntry[];
  costAnalysis: CostAnalysis;
  printTrends: PrintTrendEntry[];
}

export interface PeriodRange {
  preset: PeriodPreset;
  from?: string;
  to?: string;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>({ preset: 'thisMonth' });

  const refresh = useCallback(async (p?: PeriodRange) => {
    const target = p ?? period;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { preset: target.preset };
      if (target.preset === 'custom' && target.from && target.to) {
        params.from = target.from;
        params.to = target.to;
      }
      const response = await apiClient.get<{ data: DashboardData }>(
        '/metrics/dashboard',
        { params }
      );
      setData(response.data.data);
      if (p) setPeriod(p);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  return { data, loading, error, period, setPeriod, refresh };
}
