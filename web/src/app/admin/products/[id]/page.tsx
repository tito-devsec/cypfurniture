'use client';

import { use } from 'react';
import type { Product } from '@/lib/types';
import { useAdminQuery } from '@/components/admin/use-admin-query';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/product-form';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useAdminQuery<{ product: Product }>(`/api/products/${id}`);
  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <p className="text-sm text-danger">{error || 'Product not found'}</p>;
  return (
    <div>
      <PageHeader title={data.product.name} description={`/products/${data.product.slug}`} back={{ href: '/admin/products', label: 'Products' }} />
      <ProductForm key={data.product.id} product={data.product} />
    </div>
  );
}
