import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enterprise API Query Hook
 * Connects to live backend Express endpoints and safely normalizes response envelopes.
 *
 * @param {Function} fetcher - Async function returning API response { success, count, data, pagination }
 * @param {Object} [options] - Options including params, initialData, enabled
 */
export function useApiQuery(fetcher, options = {}) {
  const { params = {}, enabled = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestIdRef = useRef(0);

  const execute = useCallback(async (customParams = null) => {
    if (!enabled) return;

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const queryParams = customParams !== null ? customParams : params;

    try {
      const response = await fetcherRef.current(queryParams);

      if (currentRequestId === requestIdRef.current) {
        if (response && response.success !== false) {
          // Preserve full response envelope so callers can access response.data, response.pagination, etc.
          setData(response);
          setPagination(response.pagination || null);
          setCount(
            response.count !== undefined
              ? response.count
              : (Array.isArray(response.data) ? response.data.length : 0)
          );
        } else {
          throw new Error(response?.message || 'Failed to fetch data from API');
        }
        setLoading(false);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err.message || 'An unexpected error occurred while communicating with the Control Tower service');
        setLoading(false);
      }
    }
  }, [enabled, JSON.stringify(params)]);

  useEffect(() => {
    execute();
  }, [execute]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    pagination,
    count,
    loading,
    error,
    refetch,
    setData
  };
}

export default useApiQuery;
