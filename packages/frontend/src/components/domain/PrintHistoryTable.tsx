import type { PrintJobDTO, PrintJobSortField, SortOrder } from '@/hooks/usePrintHistory';
import styles from './PrintHistoryTable.module.css';

interface PrintHistoryTableProps {
  jobs: PrintJobDTO[];
  onJobClick: (job: PrintJobDTO) => void;
  sortBy?: PrintJobSortField;
  sortOrder?: SortOrder;
  onSort?: (field: PrintJobSortField) => void;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
  sucesso: 'Sucesso',
  erro: 'Erro',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
};

const STATUS_COLORS: Record<string, string> = {
  sucesso: 'success',
  erro: 'error',
  cancelada: 'warning',
  pendente: 'pending',
};

const SORT_FIELDS: Array<{ field: PrintJobSortField; label: string }> = [
  { field: 'date', label: 'Data' },
  { field: 'cost', label: 'Custo' },
  { field: 'status', label: 'Status' },
  { field: 'customer', label: 'Cliente' },
];

export function PrintHistoryTable({
  jobs,
  onJobClick,
  sortBy,
  sortOrder,
  onSort,
  page,
  totalPages,
  totalItems,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: PrintHistoryTableProps) {
  if (jobs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhum registro de impressão encontrado.</p>
      </div>
    );
  }

  const formatDate = (date: string | Date): string => {
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

  const handleSortClick = (field: PrintJobSortField) => {
    if (onSort) onSort(field);
  };

  const getSortIndicator = (field: PrintJobSortField): string => {
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const getSortAriaLabel = (field: PrintJobSortField): string => {
    if (sortBy !== field) return `Ordenar por ${SORT_FIELDS.find(f => f.field === field)?.label}`;
    return `Ordenado por ${SORT_FIELDS.find(f => f.field === field)?.label}, ${sortOrder === 'asc' ? 'crescente' : 'decrescente'}`;
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableInfo}>
        <span>{totalItems} registro(s) encontrado(s)</span>
      </div>

      <table
        className={styles.table}
        data-testid="print-history-table"
        role="table"
      >
        <thead>
          <tr>
            <th scope="col">Documento</th>
            <th scope="col">Papel</th>
            <th scope="col">Qualidade</th>
            <th scope="col">Páginas</th>
            <th
              scope="col"
              className={styles.sortableHeader}
              onClick={() => handleSortClick('customer')}
              aria-label={getSortAriaLabel('customer')}
              data-testid="sort-customer"
            >
              Cliente{getSortIndicator('customer')}
            </th>
            <th scope="col">Pedido</th>
            <th
              scope="col"
              className={styles.sortableHeader}
              onClick={() => handleSortClick('status')}
              aria-label={getSortAriaLabel('status')}
              data-testid="sort-status"
            >
              Status{getSortIndicator('status')}
            </th>
            <th
              scope="col"
              className={styles.sortableHeader}
              onClick={() => handleSortClick('cost')}
              aria-label={getSortAriaLabel('cost')}
              data-testid="sort-cost"
            >
              Custo{getSortIndicator('cost')}
            </th>
            <th
              scope="col"
              className={styles.sortableHeader}
              onClick={() => handleSortClick('date')}
              aria-label={getSortAriaLabel('date')}
              data-testid="sort-date"
            >
              Data{getSortIndicator('date')}
            </th>
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
              <td>{job.paperTypeName || job.paperTypeId}</td>
              <td className={styles.quality}>{job.quality}</td>
              <td className={styles.numeric}>{job.pageCount}</td>
              <td>{job.customerName || '-'}</td>
              <td>{job.orderNumber || '-'}</td>
              <td>
                <span
                  className={`${styles.status} ${styles[STATUS_COLORS[job.status]] || ''}`}
                  data-testid="job-status"
                  aria-label={`Status: ${STATUS_LABELS[job.status] || job.status}`}
                >
                  {STATUS_LABELS[job.status] || job.status}
                </span>
              </td>
              <td className={styles.cost}>{formatCost(job.registeredCost)}</td>
              <td className={styles.date}>{formatDate(job.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className={styles.pagination} data-testid="pagination">
        <div className={styles.paginationInfo}>
          <label htmlFor="page-size">Por página:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            data-testid="page-size-select"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className={styles.paginationControls}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            data-testid="prev-page"
            aria-label="Página anterior"
          >
            ← Anterior
          </button>
          <span data-testid="page-info">
            Página {page} de {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            data-testid="next-page"
            aria-label="Próxima página"
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
}
