'use client';

import Link from 'next/link';
import { ArrowRight, Inbox, Mail, Package, ShoppingCart, TrendingUp, FileText } from 'lucide-react';
import type { Stats } from '@/lib/types';
import { formatDateTime, formatPrice, resolveImage } from '@/lib/utils';
import { useAdminQuery } from '@/components/admin/use-admin-query';
import { Card, LoadingBlock, PageHeader, StatusBadge, AdminButton } from '@/components/admin/ui';
import { SalesChart } from '@/components/admin/sales-chart';

export default function DashboardPage() {
  const { data, loading, error } = useAdminQuery<Stats>('/api/stats');

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <p className="text-sm text-danger">{error || 'Could not load statistics.'}</p>;

  const c = data.counts;
  const commerce = data.currency;
  const cards = [
    { label: 'Revenue', value: formatPrice(c.revenue, commerce), sub: 'All non-cancelled orders', icon: TrendingUp, href: '/orders' },
    { label: 'Orders', value: c.orders, sub: `${c.pendingOrders} pending`, icon: ShoppingCart, href: '/orders?status=pending' },
    { label: 'Products', value: c.products, sub: `${c.activeProducts} visible · ${c.categories} categories`, icon: Package, href: '/products' },
    { label: 'Messages', value: c.unreadMessages, sub: 'Unread enquiries', icon: Inbox, href: '/messages' },
    { label: 'Subscribers', value: c.subscribers, sub: 'Newsletter', icon: Mail, href: '/subscribers' },
    { label: 'Blog posts', value: c.publishedPosts, sub: `${c.posts - c.publishedPosts} drafts`, icon: FileText, href: '/blog' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of your store." actions={<AdminButton href="/products/new">New product</AdminButton>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="admin-card group flex items-start justify-between p-5 transition-colors hover:border-ink">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{card.label}</p>
              <p className="mt-2 font-display text-3xl text-ink">{card.value}</p>
              <p className="mt-1 text-xs text-muted">{card.sub}</p>
            </div>
            <card.icon size={20} strokeWidth={1.5} className="text-muted transition-colors group-hover:text-accent" />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SalesChart data={data.sales} commerce={commerce} />
        </Card>
        <Card title="Orders by status">
          <ul className="space-y-2.5">
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <span className="font-medium">{data.ordersByStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="Recent orders"
          className="lg:col-span-2"
          actions={
            <Link href="/orders" className="flex items-center gap-1 text-xs text-muted hover:text-ink">
              All orders <ArrowRight size={12} />
            </Link>
          }
        >
          {data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No orders yet. They will appear here as soon as customers check out.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {o.orderNumber} <span className="font-normal text-muted">· {o.customerName}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {formatDateTime(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                      <span className="font-medium">{formatPrice(o.total, commerce)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Low stock" description={`At or below ${commerce.lowStockThreshold} units`}>
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted">All products are well stocked.</p>
            ) : (
              <ul className="space-y-3">
                {data.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/products/${p.id}`} className="flex items-center gap-3 text-sm hover:text-accent">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resolveImage(p.images[0]?.url)} alt="" className="h-10 w-8 object-cover" />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className={p.stock === 0 ? 'text-danger' : 'text-warning'}>{p.stock} left</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Most viewed">
            <ul className="space-y-3">
              {data.topProducts.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="flex items-center gap-3 text-sm hover:text-accent">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveImage(p.images[0]?.url)} alt="" className="h-10 w-8 object-cover" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-muted">{p.viewCount} views</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
