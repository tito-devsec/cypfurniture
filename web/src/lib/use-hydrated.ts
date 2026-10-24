'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** `false` during server rendering and hydration, `true` once the component runs in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/** Reads a sessionStorage value in a hydration-safe way (null on the server). */
export function useSessionValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}
