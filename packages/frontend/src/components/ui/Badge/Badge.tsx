import React from 'react';
import { cn } from '@/utils/cn';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary';

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: styles.default ?? '',
  success: styles.success ?? '',
  warning: styles.warning ?? '',
  danger: styles.danger ?? '',
  primary: styles.primary ?? '',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps): React.ReactElement {
  return (
    <span className={cn(styles.badge, VARIANT_CLASS[variant], className)}>
      {children}
    </span>
  );
}
