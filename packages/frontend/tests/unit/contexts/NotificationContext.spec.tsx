import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification, NotificationProvider } from '@/contexts/NotificationContext';

describe('NotificationContext', () => {
  describe('useNotification hook', () => {
    it('returns notify function', () => {
      const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>;
      const { result } = renderHook(() => useNotification(), { wrapper });
      expect(result.current.notify).toBeDefined();
      expect(typeof result.current.notify).toBe('function');
    });

    it('adds notification when notify is called', () => {
      const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>;
      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.notify({ message: 'Teste', type: 'success' });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        message: 'Teste',
        type: 'success',
      });
    });

    it('generates unique ID for each notification', () => {
      const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>;
      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.notify({ message: 'Msg1', type: 'success' });
        result.current.notify({ message: 'Msg2', type: 'error' });
      });

      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications[0]?.id).not.toBe(result.current.notifications[1]?.id);
    });

    it('removes notification by ID', () => {
      const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>;
      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.notify({ message: 'Msg', type: 'success' });
      });

      const id = result.current.notifications[0]?.id;

      act(() => {
        result.current.removeNotification(id!);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('supports success, error, warning, info types', () => {
      const wrapper = ({ children }: any) => <NotificationProvider>{children}</NotificationProvider>;
      const { result } = renderHook(() => useNotification(), { wrapper });

      const types: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];

      act(() => {
        types.forEach((type) => {
          result.current.notify({ message: `Test ${type}`, type });
        });
      });

      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.notifications.map((n) => n.type)).toEqual(types.slice(0, 3));
    });

    it('throws error when used outside NotificationProvider', () => {
      expect(() => {
        renderHook(() => useNotification());
      }).toThrow();
    });
  });
});
