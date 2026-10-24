'use client';

import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { Category } from '@/lib/types';
import { cn, resolveImage, slugify } from '@/lib/utils';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useToast } from '@/components/admin/toast';
import { ImageField } from '@/components/admin/image-field';
import { AdminButton, ConfirmDialog, Field, FormGrid, Input, LoadingBlock, Modal, PageHeader, Select, Textarea, Toggle } from '@/components/admin/ui';

type FormValues = { name: string; slug: string; description: string; imageUrl: string; parentId: string; isActive: boolean; showInMenu: boolean };
const empty: FormValues = { name: '', slug: '', description: '', imageUrl: '', parentId: '', isActive: true, showInMenu: true };

export default function AdminCategoriesPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useAdminQuery<Category[]>('/api/categories?includeInactive=1');
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormValues>(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categories = data ?? [];
  const parents = categories.filter((c) => !c.parentId);
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);

  const openCreate = (parentId?: number) => {
    setForm({ ...empty, parentId: parentId ? String(parentId) : '' });
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (c: Category) => {
    setForm({ name: c.name, slug: c.slug, description: c.description, imageUrl: c.imageUrl, parentId: c.parentId ? String(c.parentId) : '', isActive: c.isActive, showInMenu: c.showInMenu });
    setEditing(c);
    setCreating(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, parentId: form.parentId ? Number(form.parentId) : null, slug: form.slug || undefined };
    try {
      if (editing) {
        await adminApi.put(`/api/categories/${editing.id}`, payload);
        toast.success('Category saved');
      } else {
        await adminApi.post('/api/categories', payload);
        toast.success('Category created');
      }
      setCreating(false);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminApi.delete(`/api/categories/${deleting.id}`);
      toast.success('Category deleted');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const move = async (c: Category, dir: -1 | 1) => {
    const siblings = c.parentId ? childrenOf(c.parentId) : parents;
    const i = siblings.findIndex((s) => s.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await adminApi.put('/api/categories/reorder', { ids });
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggle = async (c: Category, key: 'isActive' | 'showInMenu') => {
    try {
      await adminApi.put(`/api/categories/${c.id}`, { [key]: !c[key] });
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const Row = ({ c, depth }: { c: Category; depth: number }) => (
    <li className={cn('flex items-center gap-3 border-b border-line px-4 py-3', depth > 0 && 'bg-cream/50 pl-12')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolveImage(c.imageUrl)} alt="" className="h-10 w-10 shrink-0 bg-surface object-cover" />
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium', !c.isActive && 'text-muted line-through')}>{c.name}</p>
        <p className="text-xs text-muted">
          /category/{c.slug} · {c.productCount} products
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => toggle(c, 'showInMenu')} className={cn('rounded-sm px-2 py-1 text-[11px] uppercase tracking-wider', c.showInMenu ? 'bg-accent-soft text-accent' : 'bg-surface text-muted')} title="Show in the navigation menu">
          {c.showInMenu ? 'In menu' : 'Not in menu'}
        </button>
        <button type="button" onClick={() => toggle(c, 'isActive')} className="rounded-sm p-1.5 text-muted hover:text-ink" title={c.isActive ? 'Hide category' : 'Show category'}>
          {c.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button type="button" onClick={() => move(c, -1)} className="rounded-sm p-1.5 text-muted hover:text-ink" title="Move up">
          <ArrowUp size={15} />
        </button>
        <button type="button" onClick={() => move(c, 1)} className="rounded-sm p-1.5 text-muted hover:text-ink" title="Move down">
          <ArrowDown size={15} />
        </button>
        {depth === 0 && (
          <button type="button" onClick={() => openCreate(c.id)} className="rounded-sm p-1.5 text-muted hover:text-ink" title="Add sub-category">
            <Plus size={15} />
          </button>
        )}
        <button type="button" onClick={() => openEdit(c)} className="rounded-sm p-1.5 text-muted hover:text-ink" title="Edit">
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => setDeleting(c)} className="rounded-sm p-1.5 text-muted hover:text-danger" title="Delete">
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );

  return (
    <div>
      <PageHeader title="Categories" description="Two levels: rooms or types, and their sub-categories. Order here is the order in the menu." actions={<AdminButton onClick={() => openCreate()} icon={<Plus size={14} />}>New category</AdminButton>} />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <ul className="admin-card overflow-hidden">
          {parents.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted">No categories yet.</li>}
          {parents.map((p) => (
            <li key={p.id}>
              <ul>
                <Row c={p} depth={0} />
                {childrenOf(p.id).map((ch) => (
                  <Row key={ch.id} c={ch} depth={1} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={editing ? `Edit ${editing.name}` : 'New category'}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </AdminButton>
            <AdminButton onClick={submit} loading={saving}>
              {editing ? 'Save' : 'Create'}
            </AdminButton>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-5">
          <FormGrid>
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))} required />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </Field>
          </FormGrid>
          <Field label="Parent category" hint="Leave empty for a top-level category.">
            <Select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))} disabled={Boolean(editing && childrenOf(editing.id).length)}>
              <option value="">None (top level)</option>
              {parents
                .filter((p) => p.id !== editing?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[80px]" />
          </Field>
          <ImageField label="Image" value={form.imageUrl} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} aspect="aspect-[16/7]" hint="Used on the home page, the mega menu and the category header." />
          <div className="space-y-3">
            <Toggle checked={form.showInMenu} onChange={(showInMenu) => setForm((f) => ({ ...f, showInMenu }))} label="Show in navigation menu" />
            <Toggle checked={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} label="Visible in the store" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title={`Delete “${deleting?.name}”?`} text="Products in this category are kept and become uncategorised. Sub-categories become top-level." />
    </div>
  );
}
