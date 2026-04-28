import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export interface PersistentNotification {
  id: string;
  title: string;
  description: string;
  type: string;
  category: 'critical' | 'warning' | 'info';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

export interface NotificationContextValue {
  notifications: ToastNotification[]; // Current visible toasts
  notify: (input: { message: string; type: NotificationType; duration?: number }) => void;
  removeNotification: (id: string) => void;
  
  // Persistent Panel State
  persistentNotifications: PersistentNotification[];
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  setPersistentNotifications: React.Dispatch<React.SetStateAction<PersistentNotification[]>>;
  unreadCount: number;
}

const NotificationCtx = createContext<NotificationContextValue | null>(null);

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION = 3000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [visibleToasts, setVisibleToasts] = useState<ToastNotification[]>([]);
  const queueRef = useRef<ToastNotification[]>([]);
  const idCounterRef = useRef(0);

  const [persistentNotifications, setPersistentNotifications] = useState<PersistentNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const removeNotification = useCallback((id: string) => {
    setVisibleToasts((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      
      // If we removed one and there's more in the queue, add the next one
      if (filtered.length < MAX_VISIBLE_TOASTS && queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        return [...filtered, next];
      }
      
      return filtered;
    });
  }, []);

  const notify = useCallback((input: { message: string; type: NotificationType; duration?: number }) => {
    const id = String(idCounterRef.current++);
    const newToast = { id, ...input };
    
    setVisibleToasts((prev) => {
      if (prev.length < MAX_VISIBLE_TOASTS) {
        return [...prev, newToast];
      } else {
        queueRef.current.push(newToast);
        return prev;
      }
    });

    const duration = input.duration || (input.type === 'error' ? 5000 : DEFAULT_DURATION);
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, [removeNotification]);

  const unreadCount = persistentNotifications.filter(n => !n.read).length;

  return (
    <NotificationCtx.Provider value={{ 
      notifications: visibleToasts, 
      notify, 
      removeNotification,
      persistentNotifications,
      setPersistentNotifications,
      isPanelOpen,
      setIsPanelOpen,
      unreadCount
    }}>
      {children}
    </NotificationCtx.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationCtx);
  if (!ctx) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return ctx;
}
