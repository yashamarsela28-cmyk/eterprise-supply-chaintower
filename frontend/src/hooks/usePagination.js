import { useState, useCallback } from 'react';

/**
 * Reusable Pagination Hook
 * @param {Object} [initialConfig]
 */
export function usePagination(initialConfig = {}) {
  const [page, setPage] = useState(initialConfig.initialPage || 1);
  const [limit, setLimit] = useState(initialConfig.initialLimit || 20);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage) => {
    setPage(Math.max(1, Number(newPage) || 1));
  }, []);

  const changeLimit = useCallback((newLimit) => {
    setLimit(Number(newLimit) || 20);
    setPage(1); // Reset to first page on limit change
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    reset
  };
}

export default usePagination;
