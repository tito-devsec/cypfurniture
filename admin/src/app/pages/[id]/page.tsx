'use client';

import { use } from 'react';
import type { Page } from '@/lib/types';
import { useAdminQuery } from '@/components/admin/use-admin-query';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { PageForm } from '@/components/admin/page-form';

export default function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useAdminQuery<Page>(`/api/pages/${id}`);
  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <p className="text-sm text-danger">{error || 'Page not found'}</p>;
  return (
    <div>
      <PageHeader title={data.title} back={{ href: '/pages', label: 'Pages' }} />
      <PageForm key={data.id} page={data} />
    </div>
  );
}
