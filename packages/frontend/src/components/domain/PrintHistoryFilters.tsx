import { useState } from 'react';
import type { PrintJobFilters, PrintStatus } from '@/hooks/usePrintHistory';
import styles from './PrintHistoryFilters.module.css';

interface PrintHistoryFiltersProps {
  filters: PrintJobFilters;
  onApply: () => void;
  onClear: () => void;
  onFilterChange: (filters: Partial<PrintJobFilters>) => void;
  loading: boolean;
}

const STATUSES: Array<{ value: PrintStatus; label: string }> = [
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'erro', label: 'Erro' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'pendente', label: 'Pendente' },
];

const ORIGINS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'SHOPEE', label: 'Shopee' },
  { value: 'MANUAL', label: 'Manual' },
];

export function PrintHistoryFilters({
  filters,
  onApply,
  onClear,
  onFilterChange,
  loading,
}: PrintHistoryFiltersProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({ startDate: value || undefined });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({ endDate: value || undefined });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({ status: (value as PrintStatus) || undefined });
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ orderId: e.target.value || undefined });
  };

  const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ documentName: e.target.value || undefined });
  };

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({ origin: (value as any) || undefined });
  };

  const handleClear = () => {
    onClear();
  };

  const formatDateForInput = (date?: string): string => {
    if (!date) return '';
    return date.split('T')[0];
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
            value={formatDateForInput(filters.startDate)}
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
            value={formatDateForInput(filters.endDate)}
            onChange={handleEndDateChange}
            disabled={loading}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            data-testid="filter-status"
            value={filters.status || ''}
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
          <label htmlFor="origin">Origem:</label>
          <select
            id="origin"
            data-testid="filter-origin"
            value={filters.origin || ''}
            onChange={handleOriginChange}
            disabled={loading}
          >
            {ORIGINS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label htmlFor="order-id">Pedido:</label>
          <input
            id="order-id"
            type="text"
            data-testid="filter-order-id"
            placeholder="Buscar..."
            value={filters.orderId || ''}
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
            value={filters.documentName || ''}
            onChange={handleDocumentNameChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.applyButton}
          onClick={onApply}
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
