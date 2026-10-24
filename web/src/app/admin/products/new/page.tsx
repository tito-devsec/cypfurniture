'use client';

import { PageHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/product-form';

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="New product" back={{ href: '/admin/products', label: 'Products' }} />
      <ProductForm />
    </div>
  );
}
