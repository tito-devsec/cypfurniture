'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken, setSession } from '@/lib/admin-api';
import type { AdminUser } from '@/lib/types';
import { AdminButton, Field, Input } from '@/components/admin/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace('/admin');
  }, [router]);

  useGSAP(() => {
    gsap.fromTo(root.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
  }, { scope: root });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ token: string; admin: AdminUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setSession(res.token, res.admin);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API. Is the server running?');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div ref={root} className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-3xl tracking-[0.3em]">CYP</span>
          <p className="mt-1 text-[10px] uppercase tracking-[0.36em] text-muted">Admin panel</p>
        </div>
        <form onSubmit={submit} className="admin-card space-y-5 p-7">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <AdminButton type="submit" className="w-full" loading={loading} icon={<ArrowRight size={14} />}>
            Sign in
          </AdminButton>
        </form>
        <p className="mt-6 text-center text-xs text-muted">The initial admin credentials are set in server/.env (ADMIN_EMAIL / ADMIN_PASSWORD).</p>
      </div>
    </div>
  );
}
