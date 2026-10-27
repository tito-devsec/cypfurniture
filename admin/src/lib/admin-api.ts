'use client';

import { apiFetch } from './api';
import type { AdminUser } from './types';

const TOKEN_KEY = 'cyp_admin_token';
const USER_KEY = 'cyp_admin_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AdminUser) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/** Authenticated request helper for the admin panel. */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, { ...init, token: getToken() });
}

export const adminApi = {
  get: <T>(path: string) => adminFetch<T>(path),
  post: <T>(path: string, body?: unknown) => adminFetch<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => adminFetch<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => adminFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => adminFetch<T>(path, { method: 'DELETE' }),
  upload: async (files: File[] | FileList) => {
    const form = new FormData();
    for (const file of Array.from(files)) form.append('files', file);
    return adminFetch<{ files: { url: string; name: string; size: number; type: string }[] }>('/api/uploads', { method: 'POST', body: form });
  },
};
