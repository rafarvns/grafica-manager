import React from 'react';
import styles from './OrderFilters.module.css';
import { OrderFilters as IOrderFilters, OrderStatus } from '@grafica/shared';

interface OrderFiltersProps {
  filters: IOrderFilters;
  onFilterChange: (filters: IOrderFilters) => void;
}

const ALL_STATUSES: { label: string; value: OrderStatus }[] = [
  { label: 'Rascunho', value: 'draft' },
  { label: 'Agendado', value: 'scheduled' },
  { label: 'Em Produção', value: 'in_production' },
  { label: 'Concluído', value: 'completed' },
  { label: 'Enviado', value: 'shipping' },
  { label: 'Cancelado', value: 'cancelled' },
];

export function OrderFilters({ filters, onFilterChange }: OrderFiltersProps) {
  const handleStatusChange = (status: OrderStatus) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <span className={styles.label}>Status:</span>
        <div className={styles.statusGrid}>
          {ALL_STATUSES.map((s) => (
            <label key={s.value} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.statuses?.includes(s.value) || false}
                onChange={() => handleStatusChange(s.value)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="customerId">Cliente:</label>
          <input
            id="customerId"
            name="customerId"
            type="text"
            value={filters.customerId || ''}
            onChange={handleInputChange}
            placeholder="ID do Cliente"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="origin">Origem:</label>
          <select
            id="origin"
            name="origin"
            value={filters.origin || 'ALL'}
            onChange={handleInputChange}
          >
            <option value="ALL">Todas</option>
            <option value="MANUAL">Manual</option>
            <option value="SHOPEE">Shopee</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="startDate">De:</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={filters.startDate || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="endDate">Até:</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={filters.endDate || ''}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}
