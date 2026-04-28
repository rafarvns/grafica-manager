import type { PrintJobStats } from '@grafica/shared/types';
import styles from './PrintHistoryStats.module.css';

interface PrintHistoryStatsProps {
  stats: PrintJobStats | null;
  loading?: boolean;
}

export function PrintHistoryStats({ stats, loading }: PrintHistoryStatsProps) {
  if (loading) {
    return (
      <div className={styles.container} data-testid="stats-loading">
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.container} data-testid="print-history-stats" role="region" aria-label="Estatísticas de impressões">
      <div className={styles.card} data-testid="stat-total" aria-label={`Total de impressões: ${stats.totalJobs}`}>
        <span className={styles.label}>Total de Impressões</span>
        <span className={styles.value} aria-live="polite">{stats.totalJobs}</span>
      </div>
      <div className={styles.card} data-testid="stat-cost" aria-label={`Custo total: R$ ${stats.totalCost.toFixed(2)}`}>
        <span className={styles.label}>Custo Total</span>
        <span className={styles.value} aria-live="polite">R$ {stats.totalCost.toFixed(2)}</span>
      </div>
      <div className={styles.card} data-testid="stat-success-rate" aria-label={`Taxa de sucesso: ${stats.successRate.toFixed(1)}%`}>
        <span className={styles.label}>Taxa de Sucesso</span>
        <span className={styles.value} aria-live="polite">{stats.successRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}