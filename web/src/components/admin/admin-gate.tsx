'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { adminApi, clearSession, getToken } from '@/lib/admin-api';
import type { AdminUser } from '@/lib/types';
import { AdminShell } from './shell';
import { ToastProvider } from './toast';
import { Spinner } from './ui';

/** Client-side auth guard for everything under /admin (except the login page). */
export function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (isLogin) return;
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    let cancelled = false;
    adminApi
      .get<{ admin: AdminUser }>('/api/auth/me')
      .then((r) => {
        if (!cancelled) setUser(r.admin);
      })
      .catch(() => {
        clearSession();
        router.replace('/admin/login');
      });
    return () => {
      cancelled = true;
    };
  }, [isLogin, router]);

  return (
    <ToastProvider>
      {isLogin ? (
        children
      ) : user ? (
        <AdminShell user={user}>{children}</AdminShell>
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <Spinner />
        </div>
      )}
    </ToastProvider>
  );
}
