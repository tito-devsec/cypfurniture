'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';

type QueryState<T> = { path: string | null; data: T | null; error: string | null };

/** Small data-fetching hook for admin pages. Re-fetches when `path` changes or `refetch()` is called. */
export function useAdminQuery<T>(path: string | null) {
  const [state, setState] = useState<QueryState<T>>({ path: null, data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    adminApi
      .get<T>(path)
      .then((data) => {
        if (!cancelled) setState({ path, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ path, data: null, error: err instanceof ApiError ? err.message : 'Request failed' });
      });
    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((data: T | null) => setState((s) => ({ ...s, data })), []);
  const current = state.path === path;

  return {
    data: current ? state.data : null,
    loading: Boolean(path) && !current,
    error: current ? state.error : null,
    refetch,
    setData,
  };
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.details?.length) return `${err.message}: ${err.details.map((d) => `${d.path} ${d.message}`).join('; ')}`;
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
