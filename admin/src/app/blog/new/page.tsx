'use client';

import { PageHeader } from '@/components/admin/ui';
import { PostForm } from '@/components/admin/post-form';

export default function NewPostPage() {
  return (
    <div>
      <PageHeader title="New post" back={{ href: '/blog', label: 'Blog' }} />
      <PostForm />
    </div>
  );
}
