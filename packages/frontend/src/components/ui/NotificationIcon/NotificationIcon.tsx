import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import styles from './NotificationIcon.module.css';

export function NotificationIcon() {
  const { unreadCount, isPanelOpen, setIsPanelOpen } = useNotifications();

  return (
    <button 
      className={`${styles.button} ${isPanelOpen ? styles.active : ''}`}
      onClick={() => setIsPanelOpen(!isPanelOpen)}
      aria-label={`${unreadCount} notificações não lidas`}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className={styles.badge}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
