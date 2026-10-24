'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { Page } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useToast } from '@/components/admin/toast';
import { AdminButton, ConfirmDialog, EmptyState, LoadingBlock, PageHeader, Table } from '@/components/admin/ui';

type PageRow = Pick<Page, 'id' | 'title' | 'slug' | 'isPublished' | 'updatedAt'>;

export default function AdminPagesPage() {
  const toast = useToast();
  const [deleting, setDeleting] = useState<PageRow | null>(null);
  const { data, loading, error, refetch } = useAdminQuery<PageRow[]>('/api/pages');

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminApi.delete(`/api/pages/${deleting.id}`);
      toast.success('Page deleted');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Pages" description="Policies, FAQ and any other free-form page. Link them from the footer in Settings." actions={<AdminButton href="/admin/pages/new" icon={<Plus size={14} />}>New page</AdminButton>} />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data?.length ? (
        <div className="admin-card">
          <EmptyState title="No pages" action={<AdminButton href="/admin/pages/new">Create a page</AdminButton>} />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Status</th>
              <th>Updated</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="hover:bg-cream/60">
                <td>
                  <Link href={`/admin/pages/${p.id}`} className="font-medium text-ink hover:text-accent">
                    {p.title}
                  </Link>
                </td>
                <td className="text-muted">/p/{p.slug}</td>
                <td>
                  <span className={p.isPublished ? 'rounded-xs bg-success/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-success' : 'rounded-xs bg-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted'}>{p.isPublished ? 'Published' : 'Hidden'}</span>
                </td>
                <td className="text-muted">{formatDate(p.updatedAt)}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/pages/${p.id}`} className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink" title="Edit">
                      <Pencil size={15} />
                    </Link>
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
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title={`Delete “${deleting?.title}”?`} />
    </div>
  );
}
