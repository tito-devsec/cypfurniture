'use client';

import { useState } from 'react';
import { Markdown } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';
import { Textarea } from './ui';

/** Markdown textarea with a live preview toggle. */
export function MarkdownField({ label, value, onChange, rows = 14, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  const [preview, setPreview] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="admin-label mb-0">{label}</span>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => setPreview(false)} className={cn('rounded-sm px-2 py-1', !preview ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
            Write
          </button>
          <button type="button" onClick={() => setPreview(true)} className={cn('rounded-sm px-2 py-1', preview ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
            Preview
          </button>
        </div>
      </div>
      {preview ? (
        <div className="min-h-[200px] rounded-sm border border-line bg-white p-5">
          {value ? <Markdown content={value} small /> : <p className="text-sm text-muted">Nothing to preview.</p>}
        </div>
      ) : (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="font-mono text-[13px] leading-relaxed" />
      )}
      <p className="mt-1 text-xs text-muted">{hint || 'Supports Markdown: ## headings, **bold**, - lists, [links](/shop), images ![alt](url).'}</p>
    </div>
  );
}
