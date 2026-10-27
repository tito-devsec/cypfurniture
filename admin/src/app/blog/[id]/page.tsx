'use client';

import { use } from 'react';
import type { BlogPost } from '@/lib/types';
import { useAdminQuery } from '@/components/admin/use-admin-query';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { PostForm } from '@/components/admin/post-form';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useAdminQuery<{ post: BlogPost }>(`/api/posts/${id}`);
  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <p className="text-sm text-danger">{error || 'Post not found'}</p>;
  return (
    <div>
      <PageHeader title={data.post.title} back={{ href: '/blog', label: 'Blog' }} />
      <PostForm key={data.post.id} post={data.post} />
    </div>
  );
}
