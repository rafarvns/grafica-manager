import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface NotificationContextValue {
  notifications: Notification[];
  notify: (input: { message: string; type: NotificationType }) => void;
  removeNotification: (id: string) => void;
}

const NotificationCtx = createContext<NotificationContextValue | null>(null);

let idCounter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((input: { message: string; type: NotificationType }) => {
    const id = String(idCounter++);
    setNotifications((prev) => [...prev, { id, message: input.message, type: input.type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationCtx.Provider value={{ notifications, notify, removeNotification }}>
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
