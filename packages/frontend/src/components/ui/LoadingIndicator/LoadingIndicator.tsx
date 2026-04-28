import React from 'react';
import styles from './LoadingIndicator.module.css';

interface LoadingIndicatorProps {
  isLoading?: boolean;
}

export function LoadingIndicator({ isLoading = false }: LoadingIndicatorProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className={styles.indicator} aria-busy="true" aria-label="Carregando">
      <div className={styles.spinner} />
    </div>
  );
}
