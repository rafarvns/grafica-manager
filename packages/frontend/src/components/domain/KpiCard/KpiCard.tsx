import React from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

export function KpiCard({ label, value, subtitle, highlight = false }: KpiCardProps) {
  return (
    <article className={`${styles.card} ${highlight ? styles.highlight : ''}`}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </article>
  );
}
