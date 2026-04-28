import React from 'react';
import { useNotification, ToastNotification } from '@/contexts/NotificationContext';
import styles from './Toast.module.css';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { notifications } = useNotification();

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <ToastItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

function ToastItem({ notification }: { notification: ToastNotification }) {
  const { removeNotification } = useNotification();

  const icons = {
    success: <CheckCircle className={styles.icon} size={20} />,
    error: <XCircle className={styles.icon} size={20} />,
    warning: <AlertTriangle className={styles.icon} size={20} />,
    info: <Info className={styles.icon} size={20} />,
  };

  return (
    <div className={`${styles.toast} ${styles[notification.type]}`} role="alert">
      {icons[notification.type]}
      <span className={styles.message}>{notification.message}</span>
      <button 
        className={styles.closeButton} 
        onClick={() => removeNotification(notification.id)}
        aria-label="Fechar"
      >
        <X size={16} />
      </button>
    </div>
  );
}
