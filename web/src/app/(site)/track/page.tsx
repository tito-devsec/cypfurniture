'use client';

import { useState, type FormEvent } from 'react';
import { Check, Search } from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import type { Order } from '@/lib/types';
import { cn, formatDate, statusLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Field, Input } from '@/components/ui/form';
import { useMoney } from '@/components/site/site-provider';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function TrackOrderPage() {
  const { formatBase } = useMoney();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const data = await apiFetch<{ order: Order }>(`/api/orders/track/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`);
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Track your order' }]} />
      <div className="mx-auto mt-8 max-w-2xl">
        <h1 className="text-4xl md:text-5xl">Track your order</h1>
        <p className="mt-3 text-muted">Enter your order number and the email address used at checkout.</p>

        <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Order number" required>
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="CYP-2026-00001" required />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={loading} icon={<Search size={15} />}>
              Find my order
            </Button>
          </div>
        </form>
        {error && <p className="mt-5 text-sm text-sale">{error}</p>}

        {order && (
          <div className="mt-12 border border-line p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Order</p>
                <p className="mt-1 font-display text-2xl">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <span className={cn('rounded-xs px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em]', order.status === 'cancelled' ? 'bg-sale/10 text-sale' : 'bg-accent-soft text-accent')}>{statusLabel(order.status)}</span>
            </div>

            {order.status !== 'cancelled' && (
              <ol className="mt-8 grid grid-cols-5 gap-2">
                {STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={step} className="flex flex-col items-center text-center">
                      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full border text-xs', done ? 'border-accent bg-accent text-white' : 'border-line text-muted')}>{done ? <Check size={14} /> : i + 1}</span>
                      <span className={cn('mt-2 text-[10px] uppercase tracking-[0.12em]', done ? 'text-ink' : 'text-muted')}>{statusLabel(step)}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-8 divide-y divide-line border-t border-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-[15px]">
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <span>{formatBase(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-4 font-display text-xl">
              <span>Total</span>
              <span>{formatBase(order.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
