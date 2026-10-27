'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Inbox, Package, Settings } from 'lucide-react';
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
    if (getToken()) router.replace('/');
  }, [router]);

  useGSAP(
    () => {
      gsap.fromTo(root.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' });
    },
    { scope: root },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ token: string; admin: AdminUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setSession(res.token, res.admin);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API. Is the server running?');
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="CYP" className="h-7 w-auto" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg tracking-[0.18em]">CYP</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">Furniture &amp; Decor</span>
          </span>
        </div>
        <div>
          <p className="font-display text-5xl leading-[1.08]">Beyond Furniture.<br />Designed for Living.</p>
          <ul className="mt-10 space-y-4 text-sm text-white/85">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <Package size={17} />
              </span>
              Manage products, categories and prices
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <Inbox size={17} />
              </span>
              Follow orders, enquiries and subscribers
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15">
                <Settings size={17} />
              </span>
              Customise colours, fonts, texts and contact details
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} CYP Furniture &amp; Decor®</p>
      </div>

      <div className="flex items-center justify-center bg-canvas px-4 py-12">
        <div ref={root} className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="CYP Furniture & Decor" className="mx-auto h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Welcome back. Enter your admin credentials.</p>
          <form onSubmit={submit} className="admin-card mt-6 space-y-5 p-6">
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
    </div>
  );
}
