import type { Metadata } from 'next';
import { ShopListing, normalizeParams } from '@/components/site/shop-listing';

export const metadata: Metadata = { title: 'Shop', description: 'Browse our full collection of home and office furniture.' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = normalizeParams(await searchParams);
  return <ShopListing params={params} />;
}
