import { useState, useMemo } from 'react';

export function usePagination(totalCount?: number) {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(25);

  const totalPages = totalCount !== undefined ? Math.max(0, Math.ceil(totalCount / pageSize)) : undefined;

  const setPage = (newPage: number) => {
    let validPage = Math.max(1, newPage);
    if (totalPages !== undefined && totalPages > 0) {
      validPage = Math.min(validPage, totalPages);
    }
    setPageState(validPage);
  };

  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize);
  };

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const hasNextPage = totalPages !== undefined ? page < totalPages : undefined;
  const hasPreviousPage = page > 1;

  const resetPage = () => {
    setPageState(1);
  };

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    offset,
    totalPages: totalPages ?? 0,
    hasNextPage: hasNextPage ?? false,
    hasPreviousPage,
    resetPage,
  };
}
