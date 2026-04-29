import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';
import type { NotificationType } from '@/contexts/NotificationContext';

export interface ToastProps {
  id?: string;
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const icons: Record<NotificationType, React.ReactElement> = {
  success: <CheckCircle className={styles.icon} size={20} />,
  error: <XCircle className={styles.icon} size={20} />,
  warning: <AlertTriangle className={styles.icon} size={20} />,
  info: <Info className={styles.icon} size={20} />,
};

export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert">
      {icons[type]}
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: NotificationType }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}
