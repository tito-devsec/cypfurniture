'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { Page } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { MarkdownField } from './markdown-field';
import { useToast } from './toast';
import { errorMessage } from './use-admin-query';
import { AdminButton, Card, Field, Input, Toggle } from './ui';

export function PageForm({ page }: { page?: Page }) {
  const router = useRouter();
  const toast = useToast();
  const [slugTouched, setSlugTouched] = useState(Boolean(page));
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState({ title: page?.title ?? '', slug: page?.slug ?? '', content: page?.content ?? '', isPublished: page?.isPublished ?? true });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (page) {
        await adminApi.put(`/api/pages/${page.id}`, { ...v, slug: v.slug || undefined });
        toast.success('Page saved');
      } else {
        const created = await adminApi.post<Page>('/api/pages', { ...v, slug: v.slug || undefined });
        toast.success('Page created');
        router.push(`/admin/pages/${created.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="Content">
          <div className="space-y-5">
            <Field label="Title" required>
              <Input
                value={v.title}
                onChange={(e) => setV((s) => ({ ...s, title: e.target.value, slug: slugTouched ? s.slug : slugify(e.target.value) }))}
                required
              />
            </Field>
            <Field label="Slug" hint="/p/your-slug">
              <Input
                value={v.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setV((s) => ({ ...s, slug: e.target.value }));
                }}
              />
            </Field>
            <MarkdownField label="Body" value={v.content} onChange={(content) => setV((s) => ({ ...s, content }))} rows={20} />
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Visibility">
          <Toggle checked={v.isPublished} onChange={(isPublished) => setV((s) => ({ ...s, isPublished }))} label="Published" />
        </Card>
        <div className="flex gap-2">
          <AdminButton type="submit" loading={saving} icon={<Save size={14} />} className="flex-1">
            {page ? 'Save changes' : 'Create page'}
          </AdminButton>
          {page && (
            <AdminButton variant="secondary" href={`/p/${page.slug}`} type="button">
              View
            </AdminButton>
          )}
        </div>
      </div>
    </form>
  );
}
