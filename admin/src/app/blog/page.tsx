'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { BlogPost, Paginated } from '@/lib/types';
import { formatDate, resolveImage } from '@/lib/utils';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useToast } from '@/components/admin/toast';
import { AdminButton, ConfirmDialog, EmptyState, LoadingBlock, PageHeader, PaginationControls, Table } from '@/components/admin/ui';

export default function AdminBlogPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const { data, loading, error, refetch } = useAdminQuery<Paginated<BlogPost>>(`/api/posts?includeDrafts=1&limit=20&page=${page}`);

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminApi.delete(`/api/posts/${deleting.id}`);
      toast.success('Post deleted');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Blog" description={data ? `${data.total} posts` : undefined} actions={<AdminButton href="/blog/new" icon={<Plus size={14} />}>New post</AdminButton>} />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data?.items.length ? (
        <div className="admin-card">
          <EmptyState title="No posts yet" text="Share buying guides, projects and news with your customers." action={<AdminButton href="/blog/new">Write a post</AdminButton>} />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Post</th>
              <th>Status</th>
              <th>Date</th>
              <th>Tags</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="hover:bg-cream/60">
                <td>
                  <Link href={`/blog/${p.id}`} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveImage(p.coverImage)} alt="" className="h-11 w-16 shrink-0 bg-surface object-cover" />
                    <span>
                      <span className="block font-medium text-ink">{p.title}</span>
                      <span className="block text-xs text-muted">/blog/{p.slug}</span>
                    </span>
                  </Link>
                </td>
                <td>
                  <span className={p.isPublished ? 'rounded-xs bg-success/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-success' : 'rounded-xs bg-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted'}>{p.isPublished ? 'Published' : 'Draft'}</span>
                </td>
                <td className="text-muted">{formatDate(p.publishedAt || p.createdAt)}</td>
                <td className="text-xs text-muted">{p.tags.join(', ') || '—'}</td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/blog/${p.id}`} className="rounded-sm p-1.5 text-muted hover:bg-surface hover:text-ink" title="Edit">
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
      {data && <PaginationControls page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title={`Delete “${deleting?.title}”?`} />
    </div>
  );
}
