import { useState } from 'react';
import { ListCustomersInput } from '@/hooks/useCustomers';
import styles from './CustomerFilters.module.css';

interface CustomerFiltersProps {
  onApply: (filters: ListCustomersInput) => void;
  onClear: () => void;
}

export function CustomerFilters({ onApply, onClear }: CustomerFiltersProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  const handleApply = () => {
    onApply({
      page: 1,
      pageSize: 10,
      ...(name && { name }),
      ...(email && { email }),
      ...(city && { city }),
    });
  };

  const handleClear = () => {
    setName('');
    setEmail('');
    setCity('');
    onClear();
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        <div className={styles.filterField}>
          <label htmlFor="customer-name">Nome:</label>
          <input
            id="customer-name"
            type="text"
            data-testid="filter-customer-name"
            placeholder="Buscar por nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="customer-email">Email:</label>
          <input
            id="customer-email"
            type="email"
            data-testid="filter-customer-email"
            placeholder="Buscar por email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="customer-city">Cidade:</label>
          <input
            id="customer-city"
            type="text"
            data-testid="filter-customer-city"
            placeholder="Buscar por cidade..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.applyButton}
          onClick={handleApply}
          data-testid="apply-customer-filters"
        >
          Buscar
        </button>
        <button
          className={styles.clearButton}
          onClick={handleClear}
          data-testid="clear-customer-filters"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
