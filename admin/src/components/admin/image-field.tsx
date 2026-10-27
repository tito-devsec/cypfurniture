'use client';

import { useRef, useState, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, FolderOpen, Link2, Trash2, Upload } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { UploadedFile } from '@/lib/types';
import { cn, resolveImage } from '@/lib/utils';
import { useAdminQuery, errorMessage } from './use-admin-query';
import { useToast } from './toast';
import { AdminButton, Input, LoadingBlock, Modal } from './ui';

/** Modal that lists previously uploaded files so they can be reused. */
export function MediaPicker({ open, onClose, onPick, multiple = false }: { open: boolean; onClose: () => void; onPick: (urls: string[]) => void; multiple?: boolean }) {
  const { data, loading } = useAdminQuery<{ items: UploadedFile[] }>(open ? '/api/uploads' : null);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (url: string) => {
    if (!multiple) {
      onPick([url]);
      onClose();
      return;
    }
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Media library"
      width="max-w-4xl"
      footer={
        multiple ? (
          <>
            <AdminButton variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton
              disabled={!selected.length}
              onClick={() => {
                onPick(selected);
                setSelected([]);
                onClose();
              }}
            >
              Use {selected.length || ''} selected
            </AdminButton>
          </>
        ) : undefined
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : !data?.items.length ? (
        <p className="py-10 text-center text-sm text-muted">No uploads yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {data.items.map((f) => (
            <button key={f.url} type="button" onClick={() => toggle(f.url)} className={cn('relative aspect-square overflow-hidden rounded-sm border bg-surface', selected.includes(f.url) ? 'border-accent ring-2 ring-accent' : 'border-line hover:border-ink')} title={f.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveImage(f.url)} alt={f.name} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/** Uploads dropped/selected files and returns their urls. */
export function useUploader() {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const upload = async (files: FileList | File[]): Promise<string[]> => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return [];
    setUploading(true);
    try {
      const res = await adminApi.upload(list);
      toast.success(`${res.files.length} file${res.files.length === 1 ? '' : 's'} uploaded`);
      return res.files.map((f) => f.url);
    } catch (err) {
      toast.error(errorMessage(err));
      return [];
    } finally {
      setUploading(false);
    }
  };
  return { upload, uploading };
}

/** Single image: preview + upload / library / url / remove. */
/** `fit="contain"` shows the whole image (logos, icons) instead of cropping it to fill the box. */
export function ImageField({
  value,
  onChange,
  label,
  aspect = 'aspect-video',
  hint,
  fit = 'cover',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
  hint?: string;
  fit?: 'cover' | 'contain';
}) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useUploader();
  const [picker, setPicker] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    const [first] = await upload(e.dataTransfer.files);
    if (first) onChange(first);
  };

  return (
    <div>
      {label && <span className="admin-label">{label}</span>}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn('relative flex items-center justify-center overflow-hidden rounded-sm border border-dashed border-line-strong bg-surface', aspect)}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveImage(value)} alt="" className={cn('h-full w-full', fit === 'contain' ? 'object-contain p-4' : 'object-cover')} />
        ) : (
          <p className="px-4 text-center text-xs text-muted">Drop an image here or use the buttons below</p>
        )}
        {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-muted">Uploading…</div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => input.current?.click()} icon={<Upload size={13} />}>
          Upload
        </AdminButton>
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => setPicker(true)} icon={<FolderOpen size={13} />}>
          Library
        </AdminButton>
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => setUrlMode((v) => !v)} icon={<Link2 size={13} />}>
          URL
        </AdminButton>
        {value && (
          <AdminButton variant="danger" size="sm" type="button" onClick={() => onChange('')} icon={<Trash2 size={13} />}>
            Remove
          </AdminButton>
        )}
      </div>
      {urlMode && (
        <div className="mt-2 flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or /uploads/…" />
          <AdminButton
            size="sm"
            type="button"
            className="h-10"
            onClick={() => {
              if (url.trim()) onChange(url.trim());
              setUrl('');
              setUrlMode(false);
            }}
          >
            Use
          </AdminButton>
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          if (e.target.files) {
            const [first] = await upload(e.target.files);
            if (first) onChange(first);
          }
          e.target.value = '';
        }}
      />
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={(urls) => urls[0] && onChange(urls[0])} />
    </div>
  );
}

export type ImageItem = { url: string; alt: string };

/** Ordered image gallery with upload, library, url, reorder and alt text. */
export function ImageListField({ value, onChange, label = 'Images' }: { value: ImageItem[]; onChange: (items: ImageItem[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useUploader();
  const [picker, setPicker] = useState(false);
  const [url, setUrl] = useState('');

  const add = (urls: string[]) => onChange([...value, ...urls.map((u) => ({ url: u, alt: '' }))]);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="admin-label">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          add(await upload(e.dataTransfer.files));
        }}
        className="rounded-sm border border-dashed border-line-strong bg-surface p-4"
      >
        {value.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">Drop images here, upload, pick from the library or paste a url. The first image is the main one.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {value.map((img, i) => (
              <li key={`${img.url}-${i}`} className="flex gap-3 rounded-sm border border-line bg-white p-2">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImage(img.url)} alt={img.alt} className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-0 top-0 bg-ink px-1 text-[9px] uppercase tracking-wider text-white">Main</span>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Input value={img.alt} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} placeholder="Alt text" className="h-8 text-xs" />
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} className="rounded-sm border border-line p-1 text-muted hover:text-ink" aria-label="Move up">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded-sm border border-line p-1 text-muted hover:text-ink" aria-label="Move down">
                      <ArrowDown size={12} />
                    </button>
                    <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="ml-auto rounded-sm border border-line p-1 text-muted hover:text-danger" aria-label="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {uploading && <p className="mt-3 text-center text-xs text-muted">Uploading…</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => input.current?.click()} icon={<Upload size={13} />}>
          Upload images
        </AdminButton>
        <AdminButton variant="secondary" size="sm" type="button" onClick={() => setPicker(true)} icon={<FolderOpen size={13} />}>
          From library
        </AdminButton>
        <div className="flex flex-1 gap-2 sm:max-w-md">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an image url" className="h-8 text-xs" />
          <AdminButton
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              if (url.trim()) add([url.trim()]);
              setUrl('');
            }}
          >
            Add
          </AdminButton>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files) add(await upload(e.target.files));
          e.target.value = '';
        }}
      />
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={add} multiple />
    </div>
  );
}
