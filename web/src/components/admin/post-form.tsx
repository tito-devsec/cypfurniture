'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { BlogPost } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { ImageField } from './image-field';
import { MarkdownField } from './markdown-field';
import { useToast } from './toast';
import { errorMessage } from './use-admin-query';
import { AdminButton, Card, Field, Input, Textarea, Toggle } from './ui';

type Values = { title: string; slug: string; excerpt: string; content: string; coverImage: string; author: string; tags: string; isPublished: boolean; publishedAt: string; readingTime: string };

export function PostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const toast = useToast();
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState<Values>({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    coverImage: post?.coverImage ?? '',
    author: post?.author ?? '',
    tags: post?.tags.join(', ') ?? '',
    isPublished: post?.isPublished ?? false,
    publishedAt: post?.publishedAt ? post.publishedAt.slice(0, 10) : '',
    readingTime: post ? String(post.readingTime) : '',
  });
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((s) => ({ ...s, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...v,
      slug: v.slug || undefined,
      readingTime: v.readingTime ? Number(v.readingTime) : undefined,
      publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : null,
    };
    try {
      if (post) {
        await adminApi.put(`/api/posts/${post.id}`, payload);
        toast.success('Post saved');
      } else {
        const created = await adminApi.post<BlogPost>('/api/posts', payload);
        toast.success('Post created');
        router.push(`/admin/blog/${created.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Content">
          <div className="space-y-5">
            <Field label="Title" required>
              <Input
                value={v.title}
                onChange={(e) => {
                  set('title', e.target.value);
                  if (!slugTouched) set('slug', slugify(e.target.value));
                }}
                required
              />
            </Field>
            <Field label="Slug" hint="/blog/your-slug">
              <Input
                value={v.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value);
                }}
              />
            </Field>
            <Field label="Excerpt" hint="Short summary shown in lists and search engines.">
              <Textarea value={v.excerpt} onChange={(e) => set('excerpt', e.target.value)} className="min-h-[80px]" maxLength={600} />
            </Field>
            <MarkdownField label="Body" value={v.content} onChange={(val) => set('content', val)} rows={22} />
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Publishing">
          <div className="space-y-5">
            <Toggle checked={v.isPublished} onChange={(val) => set('isPublished', val)} label="Published" hint="Drafts are only visible here." />
            <Field label="Publish date">
              <Input type="date" value={v.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} />
            </Field>
            <Field label="Author">
              <Input value={v.author} onChange={(e) => set('author', e.target.value)} placeholder="CYP Team" />
            </Field>
            <Field label="Tags" hint="Comma separated">
              <Input value={v.tags} onChange={(e) => set('tags', e.target.value)} />
            </Field>
            <Field label="Reading time (minutes)" hint="Leave empty to calculate automatically.">
              <Input type="number" min={1} value={v.readingTime} onChange={(e) => set('readingTime', e.target.value)} />
            </Field>
          </div>
        </Card>
        <Card title="Cover image">
          <ImageField value={v.coverImage} onChange={(url) => set('coverImage', url)} aspect="aspect-[4/3]" />
        </Card>
        <div className="sticky bottom-4 flex gap-2">
          <AdminButton type="submit" loading={saving} icon={<Save size={14} />} className="flex-1">
            {post ? 'Save changes' : 'Create post'}
          </AdminButton>
          {post?.isPublished && (
            <AdminButton variant="secondary" href={`/blog/${post.slug}`} type="button">
              View
            </AdminButton>
          )}
        </div>
      </div>
    </form>
  );
}
