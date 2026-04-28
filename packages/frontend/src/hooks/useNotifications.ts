import { useEffect, useCallback, useRef } from 'react';
import { useNotification, PersistentNotification } from '@/contexts/NotificationContext';

const POLLING_INTERVAL = 10000; // 10s

export function useNotifications() {
  const { 
    persistentNotifications, 
    setPersistentNotifications, 
    notify,
    isPanelOpen,
    setIsPanelOpen,
    unreadCount
  } = useNotification();
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('api_token');
      const response = await fetch('/api/v1/notifications?dismissed=false', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersistentNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  }, [setPersistentNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('api_token');
      const response = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setPersistentNotifications((prev: PersistentNotification[]) => 
          prev.map((n: PersistentNotification) => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, [setPersistentNotifications]);

  const dismiss = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('api_token');
      const response = await fetch(`/api/v1/notifications/${id}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setPersistentNotifications((prev: PersistentNotification[]) => prev.filter((n: PersistentNotification) => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to dismiss notification', error);
    }
  }, [setPersistentNotifications]);

  useEffect(() => {
    fetchNotifications();
    
    pollingRef.current = setInterval(fetchNotifications, POLLING_INTERVAL);
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications]);

  return {
    notifications: persistentNotifications,
    unreadCount,
    isPanelOpen,
    setIsPanelOpen,
    markAsRead,
    dismiss,
    refresh: fetchNotifications
  };
}
