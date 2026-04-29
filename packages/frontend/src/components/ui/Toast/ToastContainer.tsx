import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
