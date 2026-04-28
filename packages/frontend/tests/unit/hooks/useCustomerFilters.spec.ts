import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomerFilters } from '@/hooks/useCustomerFilters';

describe('useCustomerFilters', () => {
  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useCustomerFilters());
    expect(result.current.filters).toEqual({ name: '', email: '', city: '' });
  });

  it('updates name filter', () => {
    const { result } = renderHook(() => useCustomerFilters());

    act(() => {
      result.current.setFilters({ ...result.current.filters, name: 'Silva' });
    });

    expect(result.current.filters.name).toBe('Silva');
  });

  it('updates email filter', () => {
    const { result } = renderHook(() => useCustomerFilters());

    act(() => {
      result.current.setFilters({ ...result.current.filters, email: '@example.com' });
    });

    expect(result.current.filters.email).toBe('@example.com');
  });

  it('updates city filter', () => {
    const { result } = renderHook(() => useCustomerFilters());

    act(() => {
      result.current.setFilters({ ...result.current.filters, city: 'São Paulo' });
    });

    expect(result.current.filters.city).toBe('São Paulo');
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => useCustomerFilters());

    act(() => {
      result.current.setFilters({ name: 'Silva', email: 'test@', city: 'SP' });
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({ name: '', email: '', city: '' });
  });

  it('provides isFiltered flag when any filter is set', () => {
    const { result } = renderHook(() => useCustomerFilters());

    expect(result.current.isFiltered).toBe(false);

    act(() => {
      result.current.setFilters({ ...result.current.filters, name: 'Silva' });
    });

    expect(result.current.isFiltered).toBe(true);
  });
});
