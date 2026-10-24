'use client';

import { useRef, useState } from 'react';
import { Check, Copy, Trash2, Upload } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { UploadedFile } from '@/lib/types';
import { formatDate, resolveImage } from '@/lib/utils';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useUploader } from '@/components/admin/image-field';
import { useToast } from '@/components/admin/toast';
import { AdminButton, ConfirmDialog, EmptyState, LoadingBlock, PageHeader } from '@/components/admin/ui';

export default function AdminMediaPage() {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useUploader();
  const { data, loading, error, refetch } = useAdminQuery<{ items: UploadedFile[]; total: number }>('/api/uploads');
  const [deleting, setDeleting] = useState<UploadedFile | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const onFiles = async (files: FileList | File[]) => {
    const urls = await upload(files);
    if (urls.length) refetch();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(resolveImage(url));
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminApi.delete(`/api/uploads?url=${encodeURIComponent(deleting.url)}`);
      toast.success('File deleted');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Media library" description={data ? `${data.total} files` : undefined} actions={<AdminButton onClick={() => input.current?.click()} loading={uploading} icon={<Upload size={14} />}>Upload images</AdminButton>} />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        className="mb-6 rounded-md border border-dashed border-line-strong bg-white px-6 py-8 text-center text-sm text-muted"
      >
        Drop images anywhere in this box to upload them (JPG, PNG, WebP, GIF, SVG · max 8 MB each).
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />

      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data?.items.length ? (
        <div className="admin-card">
          <EmptyState title="No uploads yet" text="Images you upload for products, categories, the logo or blog posts are stored here." />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {data.items.map((f) => (
            <li key={f.url} className="admin-card overflow-hidden">
              <div className="aspect-square bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveImage(f.url)} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-3">
                <p className="truncate text-xs" title={f.name}>
                  {f.name}
                </p>
                <p className="text-[11px] text-muted">
                  {(f.size / 1024).toFixed(0)} KB{f.modifiedAt ? ` · ${formatDate(f.modifiedAt)}` : ''}
                </p>
                <div className="mt-2 flex gap-1">
                  <button type="button" onClick={() => copy(f.url)} className="flex flex-1 items-center justify-center gap-1 rounded-sm border border-line py-1 text-[11px] hover:border-ink">
                    {copied === f.url ? <Check size={12} /> : <Copy size={12} />} {copied === f.url ? 'Copied' : 'Copy URL'}
                  </button>
                  <button type="button" onClick={() => setDeleting(f)} className="rounded-sm border border-line px-2 text-muted hover:border-danger hover:text-danger" aria-label="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete this file?" text="Products or pages still using this image will show a placeholder." />
    </div>
  );
}
