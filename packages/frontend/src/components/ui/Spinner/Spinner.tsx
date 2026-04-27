import React from 'react';
import { cn } from '@/utils/cn';
import styles from './Spinner.module.css';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: styles.sm ?? '',
  md: styles.md ?? '',
  lg: styles.lg ?? '',
};

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Carregando...', className }: SpinnerProps): React.ReactElement {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(styles.spinner, SIZE_CLASS[size], className)}
    />
  );
}
