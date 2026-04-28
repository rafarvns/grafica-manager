import { render, act, screen, renderHook } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotification } from './NotificationContext';
import { describe, it, expect, vi } from 'vitest';

describe('NotificationContext', () => {
  it('should add a toast and automatically remove it after duration', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotification(), {
      wrapper: ({ children }) => <NotificationProvider>{children}</NotificationProvider>
    });

    act(() => {
      result.current.notify({ message: 'Success', type: 'success' });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Success');

    act(() => {
      vi.advanceTimersByTime(3001);
    });

    expect(result.current.notifications).toHaveLength(0);
    vi.useRealTimers();
  });

  it('should limit visible toasts to 3 and queue others', () => {
    const { result } = renderHook(() => useNotification(), {
      wrapper: ({ children }) => <NotificationProvider>{children}</NotificationProvider>
    });

    act(() => {
      result.current.notify({ message: 'T1', type: 'info' });
      result.current.notify({ message: 'T2', type: 'info' });
      result.current.notify({ message: 'T3', type: 'info' });
      result.current.notify({ message: 'T4', type: 'info' });
    });

    // We need to decide if 'notifications' in the context should be all or only visible.
    // Spec says: "Maximum 3 simultaneous toasts, queue for subsequent".
    // I'll implement it such that 'notifications' contains only the visible ones,
    // and there's an internal queue.
    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.notifications[0].message).toBe('T1');
  });
});
