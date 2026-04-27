import React, { useEffect } from 'react';
import { cn } from '@/utils/cn';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastProps extends ToastData {
  onClose: (id: string) => void;
  duration?: number;
}

const TYPE_CLASS: Record<ToastType, string> = {
  success: styles.success ?? '',
  error: styles.error ?? '',
  info: styles.info ?? '',
};

export function Toast({ id, message, type, onClose, duration = 3000 }: ToastProps): React.ReactElement {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={cn(styles.toast, TYPE_CLASS[type])} role="alert">
      <span>{message}</span>
      <button 
        className={styles.closeButton} 
        onClick={() => onClose(id)}
        aria-label="Fechar"
      >
        &times;
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps): React.ReactElement | null {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          {...toast} 
          onClose={onClose} 
        />
      ))}
    </div>
  );
}
