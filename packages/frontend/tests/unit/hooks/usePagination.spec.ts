import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  it('initializes with page 1 and pageSize 25', () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
  });

  it('calculates offset correctly', () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.offset).toBe(0);

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.offset).toBe(25);

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.offset).toBe(50);
  });

  it('allows changing page size', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageSize(50);
    });

    expect(result.current.pageSize).toBe(50);
    expect(result.current.offset).toBe(0);
  });

  it('recalculates offset when pageSize changes', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPage(3);
      result.current.setPageSize(50);
    });

    expect(result.current.offset).toBe(100);
  });

  it('calculates totalPages from total count', () => {
    const { result } = renderHook(() => usePagination(100));
    expect(result.current.totalPages).toBe(4);
  });

  it('handles zero total count', () => {
    const { result } = renderHook(() => usePagination(0));
    expect(result.current.totalPages).toBe(0);
  });

  it('prevents going to page 0', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPage(0);
    });

    expect(result.current.page).toBe(1);
  });

  it('prevents going beyond total pages', () => {
    const { result } = renderHook(() => usePagination(100));

    act(() => {
      result.current.setPage(10);
    });

    expect(result.current.page).toBe(4);
  });

  it('provides hasNextPage flag', () => {
    const { result } = renderHook(() => usePagination(100));

    expect(result.current.hasNextPage).toBe(true);

    act(() => {
      result.current.setPage(4);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('provides hasPreviousPage flag', () => {
    const { result } = renderHook(() => usePagination(100));

    expect(result.current.hasPreviousPage).toBe(false);

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('resets to page 1', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPage(5);
    });

    act(() => {
      result.current.resetPage();
    });

    expect(result.current.page).toBe(1);
  });
});
