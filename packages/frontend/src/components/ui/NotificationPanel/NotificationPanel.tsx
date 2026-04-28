import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import styles from './NotificationPanel.module.css';
import { X, Check, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationPanel() {
  const { 
    notifications, 
    isPanelOpen, 
    setIsPanelOpen, 
    markAsRead, 
    dismiss,
    refresh
  } = useNotifications();

  if (!isPanelOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={() => setIsPanelOpen(false)} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Notificações</h2>
          <button className={styles.closeButton} onClick={() => setIsPanelOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`${styles.item} ${!n.read ? styles.unread : ''} ${styles[n.category]}`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.title}>{n.title}</span>
                  <span className={styles.time}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className={styles.description}>{n.description}</p>
                
                <div className={styles.actions}>
                  {n.actionUrl && (
                    <a 
                      href={n.actionUrl} 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate logic here if using router
                      }}
                    >
                      <ExternalLink size={14} />
                      {n.actionLabel || 'Ver Detalhes'}
                    </a>
                  )}
                  <div className={styles.itemUtils}>
                    {!n.read && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                        title="Marcar como lida"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                      title="Dispensar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
