import React, { useEffect, useRef, useCallback } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { useDashboard, PeriodPreset, PeriodRange } from '@/hooks/useDashboard';
import { KpiCard } from '@/components/domain/KpiCard/KpiCard';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './DashboardPage.module.css';

Chart.register(...registerables);

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: 'Hoje',
  lastSevenDays: 'Últimos 7 dias',
  thisWeek: 'Esta semana',
  thisMonth: 'Este mês',
  custom: 'Personalizado',
};

const PRESET_OPTIONS: PeriodPreset[] = ['today', 'lastSevenDays', 'thisWeek', 'thisMonth'];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DashboardPage() {
  const { data, loading, error, period, refresh } = useDashboard();
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const originChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartInstance = useRef<Chart | null>(null);
  const originChartInstance = useRef<Chart | null>(null);

  const buildTrendChart = useCallback(() => {
    if (!trendChartRef.current || !data || !data.printTrends.length) return;
    trendChartInstance.current?.destroy();
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.printTrends.map((e) => e.date),
        datasets: [
          {
            label: 'Impressões',
            data: data.printTrends.map((e) => e.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            tension: 0.3,
            pointRadius: 4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
    trendChartInstance.current = new Chart(trendChartRef.current, config);
  }, [data]);

  const buildOriginChart = useCallback(() => {
    if (!originChartRef.current || !data || !data.metrics.newOrders) return;
    originChartInstance.current?.destroy();
    const { byOrigin } = data.metrics.newOrders;
    const labels = Object.keys(byOrigin);
    const values = labels.map((k) => byOrigin[k] ?? 0);
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#a855f7'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
      },
    };
    originChartInstance.current = new Chart(originChartRef.current, config);
  }, [data]);

  useEffect(() => {
    buildTrendChart();
    buildOriginChart();
    return () => {
      trendChartInstance.current?.destroy();
      originChartInstance.current?.destroy();
    };
  }, [buildTrendChart, buildOriginChart]);

  useEffect(() => {
    refresh();
  }, []);

  const handlePeriodChange = (preset: PeriodPreset) => {
    const next: PeriodRange = { preset };
    refresh(next);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.controls}>
          <nav className={styles.periodNav} aria-label="Período">
            {PRESET_OPTIONS.map((p) => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period.preset === p ? styles.active : ''}`}
                onClick={() => handlePeriodChange(p)}
                aria-pressed={period.preset === p}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </nav>
          <Button
            onClick={() => refresh()}
            isLoading={loading}
            variant="primary"
            aria-label="Atualizar dashboard"
          >
            Atualizar
          </Button>
          <Button
            onClick={handleExportPdf}
            variant="secondary"
            aria-label="Exportar PDF"
          >
            Exportar PDF
          </Button>
        </div>
      </header>

      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}

      {loading && !data && (
        <div className={styles.loadingCenter}>
          <Spinner />
        </div>
      )}

      {data && (
        <>
          <section aria-label="KPIs" className={styles.kpiGrid}>
            <KpiCard
              label="Impressões no período"
              value={data.metrics.printsTodayCount.toLocaleString('pt-BR')}
            />
            <KpiCard
              label="Pedidos em aberto"
              value={data.metrics.openOrdersCount.toLocaleString('pt-BR')}
            />
            <KpiCard
              label="Faturamento"
              value={formatCurrency(data.metrics.revenue)}
              highlight
            />
            <KpiCard
              label="Custo de impressão"
              value={formatCurrency(data.metrics.cost)}
            />
            <KpiCard
              label="Margem bruta"
              value={formatPercent(data.metrics.grossMarginPercent)}
              subtitle={`${formatCurrency(data.costAnalysis.grossMargin)} de lucro bruto`}
            />
            <KpiCard
              label="Pedidos novos"
              value={data.metrics.newOrders.total.toLocaleString('pt-BR')}
              subtitle={Object.entries(data.metrics.newOrders.byOrigin)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ')}
            />
            <KpiCard
              label="Maior cliente"
              value={data.metrics.topCustomer?.name ?? '—'}
              {...(data.metrics.topCustomer
                ? { subtitle: formatCurrency(data.metrics.topCustomer.revenue) }
                : {})}
            />
          </section>

          <div className={styles.chartsRow}>
            <section className={styles.chartCard} aria-label="Tendência de impressões">
              <h2 className={styles.sectionTitle}>Tendência de impressões</h2>
              {data.printTrends.length > 0 ? (
                <canvas ref={trendChartRef} role="img" aria-label="Gráfico de tendência de impressões" />
              ) : (
                <p className={styles.empty}>Sem dados de impressão no período.</p>
              )}
            </section>

            <section className={styles.chartCard} aria-label="Pedidos por origem">
              <h2 className={styles.sectionTitle}>Pedidos por origem</h2>
              {Object.keys(data.metrics.newOrders.byOrigin).length > 0 ? (
                <canvas ref={originChartRef} role="img" aria-label="Gráfico de distribuição de pedidos por origem" />
              ) : (
                <p className={styles.empty}>Sem pedidos no período.</p>
              )}
            </section>
          </div>

          <section aria-label="Top clientes">
            <h2 className={styles.sectionTitle}>Top 5 clientes por faturamento</h2>
            {data.topCustomers.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Pedidos</th>
                    <th scope="col">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.map((c, idx) => (
                    <tr key={c.customerId}>
                      <td>{idx + 1}</td>
                      <td>{c.name}</td>
                      <td>{c.orderCount}</td>
                      <td>{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.empty}>Sem clientes com faturamento no período.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
