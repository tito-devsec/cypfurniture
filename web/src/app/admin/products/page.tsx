'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { Category, Paginated, Product } from '@/lib/types';
import { cn, formatPrice, resolveImage } from '@/lib/utils';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useSiteSettings } from '@/components/admin/use-settings';
import { useToast } from '@/components/admin/toast';
import { AdminButton, ConfirmDialog, EmptyState, Input, LoadingBlock, PageHeader, PaginationControls, Select, Table } from '@/components/admin/ui';

export default function AdminProductsPage() {
  const toast = useToast();
  const { commerce } = useSiteSettings();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const withReset = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const path = useMemo(() => {
    const sp = new URLSearchParams({ includeInactive: '1', limit: '20', page: String(page), sort });
    if (debounced) sp.set('q', debounced);
    if (category) sp.set('categoryId', category);
    return `/api/products?${sp.toString()}`;
  }, [debounced, category, page, sort]);

  const { data, loading, error, refetch } = useAdminQuery<Paginated<Product>>(path);
  const { data: categories } = useAdminQuery<Category[]>('/api/categories?includeInactive=1');

  const items = (data?.items ?? []).filter((p) => (status === 'active' ? p.isActive : status === 'hidden' ? !p.isActive : true));

  const duplicate = async (p: Product) => {
    try {
      await adminApi.post(`/api/products/${p.id}/duplicate`);
      toast.success('Product duplicated (hidden until you publish it)');
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminApi.delete(`/api/products/${deleting.id}`);
      toast.success('Product deleted');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await adminApi.patch(`/api/products/${p.id}`, { isActive: !p.isActive });
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Products" description={data ? `${data.total} products in the catalogue` : undefined} actions={<AdminButton href="/admin/products/new" icon={<Plus size={14} />}>New product</AdminButton>} />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_200px_160px_180px]">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, SKU, tag…" className="pl-9" />
        </div>
        <Select value={category} onChange={withReset(setCategory)}>
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent ? `${c.parent.name} › ` : ''}
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={withReset(setStatus)}>
          <option value="">All statuses</option>
          <option value="active">Visible</option>
          <option value="hidden">Hidden</option>
        </Select>
        <Select value={sort} onChange={withReset(setSort)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price low–high</option>
          <option value="price-desc">Price high–low</option>
          <option value="popular">Most viewed</option>
        </Select>
      </div>

      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : items.length === 0 ? (
        <div className="admin-card">
          <EmptyState title="No products found" text="Try a different search or create your first product." action={<AdminButton href="/admin/products/new">New product</AdminButton>} />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Labels</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-cream/60">
                <td>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveImage(p.images[0]?.url)} alt="" className="h-12 w-10 shrink-0 bg-surface object-cover" />
                    <span>
                      <span className="block font-medium text-ink">{p.name}</span>
                      <span className="block text-xs text-muted">{p.sku || p.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="text-muted">{p.category ? `${p.category.parent ? `${p.category.parent.name} › ` : ''}${p.category.name}` : '—'}</td>
                <td>
                  {p.price > 0 ? (
                    <>
                      <span className="font-medium">{formatPrice(p.price, commerce)}</span>
                      {p.compareAtPrice ? <s className="ml-1 text-xs text-muted">{formatPrice(p.compareAtPrice, commerce)}</s> : null}
                    </>
                  ) : (
                    <span className="text-xs uppercase tracking-wider text-muted">On request</span>
                  )}
                </td>
                <td className={cn(p.stock <= commerce.lowStockThreshold && 'text-warning', p.stock === 0 && 'text-danger')}>{p.stock}</td>
                <td className="text-xs text-muted">{[p.isFeatured && 'Featured', p.isNew && 'New', p.isBestSeller && 'Best seller'].filter(Boolean).join(', ') || '—'}</td>
                <td>
                  <button type="button" onClick={() => toggleActive(p)} className={cn('rounded-xs px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider', p.isActive ? 'bg-success/10 text-success' : 'bg-surface text-muted')} title="Click to toggle visibility">
                    {p.isActive ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/products/${p.id}`} className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink" title="Edit">
                      <Pencil size={15} />
                    </Link>
                    <button type="button" onClick={() => duplicate(p)} className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink" title="Duplicate">
                      <Copy size={15} />
                    </button>
                    <button type="button" onClick={() => setDeleting(p)} className="rounded-sm p-1.5 text-muted hover:bg-danger/10 hover:text-danger" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <PaginationControls page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title={`Delete “${deleting?.name}”?`} text="The product and its images will be removed from the catalogue. Past orders keep their line items." />
    </div>
  );
}
