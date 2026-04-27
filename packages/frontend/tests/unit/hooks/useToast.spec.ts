import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useToast } from '@/hooks/useToast';

describe('useToast', () => {
  it('inicializa com lista vazia', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adiciona um novo toast e gera id', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast({ message: 'Sucesso', type: 'success' });
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].message).toBe('Sucesso');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('remove um toast pelo id', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast({ message: 'A', type: 'info' });
      result.current.addToast({ message: 'B', type: 'info' });
    });

    const idToRemove = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(idToRemove);
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].message).toBe('B');
  });
});
