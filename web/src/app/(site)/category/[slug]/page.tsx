import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategory } from '@/lib/api';
import { ShopListing, normalizeParams } from '@/components/site/shop-listing';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found' };
  return { title: category.name, description: category.description || `Shop ${category.name} furniture.` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  return <ShopListing params={normalizeParams(await searchParams)} category={category} />;
}
