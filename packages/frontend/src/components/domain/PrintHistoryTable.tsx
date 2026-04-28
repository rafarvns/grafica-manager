import { PrintJob } from '@/hooks/usePrintHistory';
import styles from './PrintHistoryTable.module.css';

interface PrintHistoryTableProps {
  jobs: PrintJob[];
  onJobClick: (job: PrintJob) => void;
}

const STATUS_LABELS: Record<string, string> = {
  sucesso: 'Sucesso',
  erro: 'Erro',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  sucesso: 'success',
  erro: 'error',
  cancelada: 'warning',
};

export function PrintHistoryTable({ jobs, onJobClick }: PrintHistoryTableProps) {
  if (jobs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhum registro de impressão encontrado.</p>
      </div>
    );
  }

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost: number): string => {
    return `R$ ${cost.toFixed(2)}`;
  };

  return (
    <div className={styles.tableContainer}>
      <table
        className={styles.table}
        data-testid="print-history-table"
      >
        <thead>
          <tr>
            <th>Documento</th>
            <th>Tipo de Papel</th>
            <th>Qualidade</th>
            <th>Páginas</th>
            <th>Status</th>
            <th>Custo</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className={styles.row}
              onClick={() => onJobClick(job)}
              data-testid="print-job-row"
            >
              <td className={styles.documentName}>{job.documentName}</td>
              <td>{job.paperTypeId}</td>
              <td className={styles.quality}>{job.quality}</td>
              <td className={styles.numeric}>{job.pageCount}</td>
              <td>
                <span
                  className={`${styles.status} ${styles[STATUS_COLORS[job.status]]}`}
                  data-testid="job-status"
                >
                  {STATUS_LABELS[job.status]}
                </span>
              </td>
              <td className={styles.cost}>{formatCost(job.registeredCost)}</td>
              <td className={styles.date}>{formatDate(job.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
