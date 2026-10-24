'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ORDER_STATUSES, type Order, type Paginated } from '@/lib/types';
import { formatDateTime, formatPrice, statusLabel } from '@/lib/utils';
import { useAdminQuery } from '@/components/admin/use-admin-query';
import { useSiteSettings } from '@/components/admin/use-settings';
import { EmptyState, Input, LoadingBlock, PageHeader, PaginationControls, Select, StatusBadge, Table } from '@/components/admin/ui';

function OrdersList() {
  const sp = useSearchParams();
  const { commerce } = useSiteSettings();
  const [status, setStatus] = useState(sp.get('status') || '');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    if (debounced) params.set('q', debounced);
    return `/api/orders?${params.toString()}`;
  }, [page, status, debounced]);

  const { data, loading, error } = useAdminQuery<Paginated<Order>>(path);

  return (
    <div>
      <PageHeader title="Orders" description={data ? `${data.total} orders` : undefined} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, customer, email or phone" className="pl-9" />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data?.items.length ? (
        <div className="admin-card">
          <EmptyState title="No orders" text="Orders placed through the checkout will show up here." />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o.id} className="hover:bg-cream/60">
                <td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:text-accent">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                </td>
                <td>
                  <p>{o.customerName}</p>
                  <p className="text-xs text-muted">
                    {o.email} · {o.phone}
                  </p>
                </td>
                <td className="text-muted">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="text-muted">{statusLabel(o.paymentMethod)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="text-right font-medium">{formatPrice(o.total, commerce)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <PaginationControls page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
