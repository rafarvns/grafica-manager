import React, { useEffect } from 'react';
import { Notification } from '@/contexts/NotificationContext';
import styles from './Toast.module.css';

const AUTO_DISMISS_MS = 3000;

interface ToastProps {
  notification: Notification;
  onDismiss: () => void;
}

export function Toast({ notification, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgClass = {
    success: styles.success,
    error: styles.error,
    warning: styles.warning,
    info: styles.info,
  }[notification.type];

  return (
    <div className={`${styles.toast} ${bgClass}`} role="alert">
      <span className={styles.message}>{notification.message}</span>
      <button
        className={styles.close}
        onClick={onDismiss}
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  );
}
