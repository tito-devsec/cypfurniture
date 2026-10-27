'use client';

import { PageHeader } from '@/components/admin/ui';
import { PageForm } from '@/components/admin/page-form';

export default function NewPagePage() {
  return (
    <div>
      <PageHeader title="New page" back={{ href: '/pages', label: 'Pages' }} />
      <PageForm />
    </div>
  );
}
