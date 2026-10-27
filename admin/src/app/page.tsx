'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, FileText, Inbox, Mail, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Stats } from '@/lib/types';
import { formatDateTime, formatPrice, initials, resolveImage, statusLabel, timeAgo } from '@/lib/utils';
import { useAdminQuery } from '@/components/admin/use-admin-query';
import { AdminButton, Card, LoadingBlock, PageHeader, ProgressBar, StatTile, StatusBadge } from '@/components/admin/ui';
import { OrdersLineChart, SalesChart } from '@/components/admin/sales-chart';

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function DashboardPage() {
  const { data, loading, error } = useAdminQuery<Stats>('/api/stats');
  const [tab, setTab] = useState<'orders' | 'messages'>('orders');

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <p className="text-sm text-danger">{error || 'Could not load statistics.'}</p>;

  const c = data.counts;
  const commerce = data.currency;
  const statusTotal = Object.values(data.ordersByStatus).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" description="A snapshot of your store today." actions={<AdminButton href="/products/new">New product</AdminButton>} />

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="red" label="Revenue" value={formatPrice(c.revenue, commerce)} sub="All non-cancelled orders" icon={TrendingUp} href="/orders" />
        <StatTile tone="orange" label="Orders" value={c.orders} sub={`${c.pendingOrders} pending`} icon={ShoppingCart} href="/orders?status=pending" />
        <StatTile tone="dark" label="Products" value={c.products} sub={`${c.activeProducts} visible · ${c.categories} categories`} icon={Package} href="/products" />
        <StatTile label="Messages" value={c.unreadMessages} sub="Unread enquiries" icon={Inbox} href="/messages" />
      </div>

      {/* Charts + top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card accent="red" title="Revenue trend" description="Last 30 days">
          <SalesChart data={data.sales} commerce={commerce} />
        </Card>
        <Card accent="dark" title="Orders per day" description="Last 30 days">
          <OrdersLineChart data={data.sales} />
        </Card>
        <Card
          title="Top products"
          description="Most viewed"
          padded={false}
          actions={
            <Link href="/products?sort=popular" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              All <ArrowRight size={12} />
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {data.topProducts.map((p, i) => (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-cream">
                  <span className="w-4 text-xs font-semibold text-muted">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImage(p.images[0]?.url)} alt="" className="h-10 w-8 rounded-sm object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block text-xs text-muted">{p.price > 0 ? formatPrice(p.price, commerce) : 'Request a quote'}</span>
                  </span>
                  <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">{p.viewCount}</span>
                </Link>
              </li>
            ))}
            {data.topProducts.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No product views yet.</li>}
          </ul>
        </Card>
      </div>

      {/* Pipeline + highlights + low stock */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Order pipeline" description={`${statusTotal} orders by status`}>
          <ul className="space-y-3">
            {STATUS_ORDER.map((s) => {
              const n = data.ordersByStatus[s] ?? 0;
              return (
                <li key={s}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{statusLabel(s)}</span>
                    <span className="text-muted">{n}</span>
                  </div>
                  <ProgressBar value={n} max={Math.max(1, statusTotal)} tone={s === 'delivered' ? 'green' : s === 'cancelled' ? 'dark' : s === 'pending' ? 'orange' : 'red'} />
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid gap-4">
          <StatTile tone="orange" label="Newsletter" value={c.subscribers} sub="Subscribers" icon={Mail} href="/subscribers" />
          <StatTile tone="white" label="Blog" value={c.publishedPosts} sub={`${c.posts - c.publishedPosts} drafts`} icon={FileText} href="/blog" />
        </div>

        <Card title="Low stock" description={`At or below ${commerce.lowStockThreshold} units`} padded={false}>
          {data.lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveImage(p.images[0]?.url)} alt="" className="h-10 w-8 rounded-sm object-cover" />
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <span className={p.stock === 0 ? 'rounded-md bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger' : 'rounded-md bg-accent-2/20 px-2 py-0.5 text-[11px] font-semibold text-[#8a5200]'}>
                      {p.stock === 0 ? 'Made to order' : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Activity + recent orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Activity"
          padded={false}
          actions={
            <div className="flex gap-1 rounded-md bg-white/60 p-0.5">
              {(['orders', 'messages'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={tab === t ? 'rounded px-3 py-1 text-xs font-semibold bg-accent text-white' : 'rounded px-3 py-1 text-xs font-medium text-muted hover:text-ink'}>
                  {t === 'orders' ? 'Orders' : 'Messages'}
                </button>
              ))}
            </div>
          }
        >
          <ul className="divide-y divide-line">
            {tab === 'orders' &&
              data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-start gap-3 px-5 py-3 text-sm transition-colors hover:bg-cream">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                      <ShoppingCart size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block">
                        <span className="font-medium">{o.customerName}</span> placed order <span className="font-medium text-accent">{o.orderNumber}</span>
                      </span>
                      <span className="block text-xs text-muted">
                        {o.items.length} item{o.items.length === 1 ? '' : 's'} · {formatPrice(o.total, commerce)} · {timeAgo(o.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            {tab === 'messages' &&
              data.recentMessages.map((m) => (
                <li key={m.id}>
                  <Link href="/messages" className="flex items-start gap-3 px-5 py-3 text-sm transition-colors hover:bg-cream">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-2/20 text-[#8a5200]">
                      <Mail size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block">
                        <span className="font-medium">{m.name}</span> sent a message{m.subject ? `: ${m.subject}` : ''}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {m.message.slice(0, 80)} · {timeAgo(m.createdAt)}
                      </span>
                    </span>
                    {!m.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                  </Link>
                </li>
              ))}
            {tab === 'orders' && data.recentOrders.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No orders yet. They will appear here as soon as customers check out.</li>}
            {tab === 'messages' && data.recentMessages.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No messages yet.</li>}
          </ul>
        </Card>

        <Card
          title="Recent orders"
          padded={false}
          actions={
            <Link href="/orders" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              All orders <ArrowRight size={12} />
            </Link>
          }
        >
          {data.recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-cream">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{initials(o.customerName)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.customerName}</span>
                      <span className="block text-xs text-muted">
                        {o.orderNumber} · {formatDateTime(o.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="rounded-md bg-accent-2 px-2.5 py-1 text-xs font-semibold text-ink">{formatPrice(o.total, commerce)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
