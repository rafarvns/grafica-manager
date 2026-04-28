import React from 'react';
import { ErrorLogEntry } from '@/types/shopee';
import styles from './ErrorLogSection.module.css';

interface ErrorLogSectionProps {
  errors: ErrorLogEntry[];
  loading: boolean;
}

export const ErrorLogSection: React.FC<ErrorLogSectionProps> = ({ errors, loading }) => {
  if (loading) return <div>Carregando logs de erro...</div>;

  return (
    <div className={styles.container}>
      <h4>Logs de Erros Recentes</h4>
      <div className={styles.list}>
        {errors.map((error) => (
          <div key={error.id} className={styles.item}>
            <div className={styles.header}>
              <span className={styles.type}>{error.type}</span>
              <span className={styles.time}>{new Date(error.timestamp).toLocaleString()}</span>
            </div>
            <p className={styles.message}>{error.message}</p>
            {error.webhookId && (
              <span className={styles.link}>Webhook ID: {error.webhookId}</span>
            )}
          </div>
        ))}
        {errors.length === 0 && <p className={styles.empty}>Nenhum erro registrado recentemente.</p>}
      </div>
    </div>
  );
};
