'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { AdminButton } from './ui';

type Props<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  title?: (item: T, index: number) => string;
  max?: number;
  emptyText?: string;
};

/** Generic editor for arrays of objects (hero slides, features, links ...). */
export function ListEditor<T>({ items, onChange, create, render, addLabel = 'Add item', title, max, emptyText = 'Nothing here yet.' }: Props<T>) {
  const update = (i: number, patch: Partial<T>) => onChange(items.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="rounded-sm border border-dashed border-line px-4 py-6 text-center text-xs text-muted">{emptyText}</p>}
      {items.map((item, i) => (
        <div key={i} className="rounded-sm border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line bg-cream px-3 py-2">
            <span className="text-xs font-medium text-muted">{title ? title(item, i) : `Item ${i + 1}`}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-sm p-1 text-muted hover:text-ink disabled:opacity-30" aria-label="Move up">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="rounded-sm p-1 text-muted hover:text-ink disabled:opacity-30" aria-label="Move down">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded-sm p-1 text-muted hover:text-danger" aria-label="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="p-4">{render(item, (patch) => update(i, patch), i)}</div>
        </div>
      ))}
      {(!max || items.length < max) && (
        <AdminButton type="button" variant="secondary" size="sm" onClick={() => onChange([...items, create()])} icon={<Plus size={13} />}>
          {addLabel}
        </AdminButton>
      )}
    </div>
  );
}
