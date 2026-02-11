'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient, { getApiErrorMessage, isRequestCancelled } from '@/lib/api';

/** Standard API success wrapper used by the backend. */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export interface UseApiGetOptions {
  /** If false, the request is not sent. Default true. */
  enabled?: boolean;
  /** Fallback message when the request fails (e.g. i18n key result). */
  errorFallback: string;
}

/**
 * Fetch one GET URL on mount (and when url or refetch changes), track loading/error/data, cancel on unmount.
 * Good for simple "load one list on mount" (e.g. decks list, optimizer status).
 */
export function useApiGet<T>(
  url: string,
  options: UseApiGetOptions
): { data: T | null; loading: boolean; error: string; refetch: () => void } {
  const { enabled = true, errorFallback } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refetchCounter, setRefetchCounter] = useState(0);

  const refetch = useCallback(() => {
    setRefetchCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const ac = new AbortController();
    queueMicrotask(() => {
      setLoading(true);
      setError('');
    });
    apiClient
      .get<ApiResponse<T>>(url, { signal: ac.signal })
      .then((res) => {
        if (res.data?.success && res.data.data !== undefined) {
          setData(res.data.data as T);
        }
      })
      .catch((err) => {
        if (!isRequestCancelled(err)) setError(getApiErrorMessage(err, errorFallback));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [url, enabled, errorFallback, refetchCounter]);

  return { data, loading, error, refetch };
}
