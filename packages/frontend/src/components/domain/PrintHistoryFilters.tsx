import { useState } from 'react';
import { PrintFilters, PrintStatus } from '@/hooks/usePrintHistory';
import styles from './PrintHistoryFilters.module.css';

interface PrintHistoryFiltersProps {
  filters: PrintFilters;
  onApply: (filters: PrintFilters) => void;
  onClear: () => void;
  loading: boolean;
}

const STATUSES: Array<{ value: PrintStatus; label: string }> = [
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'erro', label: 'Erro' },
  { value: 'cancelada', label: 'Cancelada' },
];

export function PrintHistoryFilters({
  filters,
  onApply,
  onClear,
  loading,
}: PrintHistoryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PrintFilters>(filters);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalFilters((prev) => ({
      ...prev,
      startDate: value ? new Date(value) : undefined,
    }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalFilters((prev) => ({
      ...prev,
      endDate: value ? new Date(value) : undefined,
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalFilters((prev) => ({
      ...prev,
      status: (value as PrintStatus) || undefined,
    }));
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters((prev) => ({
      ...prev,
      orderId: e.target.value || undefined,
    }));
  };

  const handleDocumentNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      documentName: e.target.value || undefined,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        <div className={styles.filterField}>
          <label htmlFor="start-date">Data Inicial:</label>
          <input
            id="start-date"
            type="date"
            data-testid="filter-start-date"
            value={formatDateForInput(localFilters.startDate)}
            onChange={handleStartDateChange}
            disabled={loading}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="end-date">Data Final:</label>
          <input
            id="end-date"
            type="date"
            data-testid="filter-end-date"
            value={formatDateForInput(localFilters.endDate)}
            onChange={handleEndDateChange}
            disabled={loading}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            data-testid="filter-status"
            value={localFilters.status || ''}
            onChange={handleStatusChange}
            disabled={loading}
          >
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label htmlFor="order-id">ID do Pedido:</label>
          <input
            id="order-id"
            type="text"
            data-testid="filter-order-id"
            placeholder="Buscar..."
            value={localFilters.orderId || ''}
            onChange={handleOrderIdChange}
            disabled={loading}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="document-name">Documento:</label>
          <input
            id="document-name"
            type="text"
            data-testid="filter-document-name"
            placeholder="Buscar..."
            value={localFilters.documentName || ''}
            onChange={handleDocumentNameChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.applyButton}
          onClick={handleApply}
          disabled={loading}
          data-testid="apply-filters-button"
        >
          Aplicar Filtros
        </button>
        <button
          className={styles.clearButton}
          onClick={handleClear}
          disabled={loading}
          data-testid="clear-filters-button"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
