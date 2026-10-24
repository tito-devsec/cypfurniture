import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryTree, getPriceRange, getProducts } from '@/lib/api';
import type { Category } from '@/lib/types';
import { resolveImage } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from '@/components/ui/breadcrumbs';
import { Pagination } from '@/components/ui/pagination';
import { SplitHeading } from '@/components/ui/split-heading';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { ProductGrid } from './product-grid';
import { ShopFilters, ShopToolbar } from './shop-filters';

export type SearchParams = Record<string, string | undefined>;

export function normalizeParams(raw: Record<string, string | string[] | undefined>): SearchParams {
  const out: SearchParams = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

type CategoryDetail = Category & { children: Category[]; parent: Category | null };

export async function ShopListing({ params, category }: { params: SearchParams; category?: CategoryDetail }) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 12;
  const [result, categories, priceRange] = await Promise.all([
    getProducts({
      q: params.q,
      category: category?.slug,
      sort: params.sort,
      page,
      limit,
      sale: params.sale === '1',
      new: params.new === '1',
      bestseller: params.bestseller === '1',
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    }),
    getCategoryTree(),
    getPriceRange(),
  ]);

  const crumbs: Crumb[] = [{ label: 'Shop', href: '/shop' }];
  if (category?.parent) crumbs.push({ label: category.parent.name, href: `/category/${category.parent.slug}` });
  if (category) crumbs.push({ label: category.name });

  const title = category ? category.name : params.q ? `Results for “${params.q}”` : 'All products';
  const description = category?.description || (params.q ? '' : 'Explore our full collection of furniture for the home and office.');
  const basePath = category ? `/category/${category.slug}` : '/shop';
  const from = result.total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(result.total, page * limit);

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={crumbs} />

      <header className="mt-8 mb-10 grid gap-8 lg:mb-14 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <SplitHeading as="h1" text={title} className="text-4xl leading-[1.05] md:text-6xl" immediate />
          {description && (
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{description}</p>
            </Reveal>
          )}
          {category && category.children.length > 0 && (
            <Reveal delay={0.3} className="mt-7 flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link key={child.id} href={`/category/${child.slug}`} className="border border-line px-4 py-2 text-[12px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white">
                  {child.name}
                </Link>
              ))}
            </Reveal>
          )}
        </div>
        {category?.imageUrl && (
          <Reveal delay={0.25} className="relative hidden aspect-[16/7] overflow-hidden bg-surface lg:col-span-5 lg:block">
            <Image src={resolveImage(category.imageUrl)} alt={category.name} fill sizes="40vw" className="object-cover" priority />
          </Reveal>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[250px_1fr] lg:gap-14">
        <Suspense>
          <ShopFilters categories={categories} activeSlug={category?.slug} priceRange={priceRange} />
        </Suspense>
        <div>
          <Suspense>
            <ShopToolbar total={result.total} from={from} to={to} />
          </Suspense>
          {result.items.length > 0 ? (
            <ProductGrid products={result.items} columns={3} priorityCount={3} />
          ) : (
            <div className="border border-dashed border-line px-6 py-20 text-center">
              <p className="font-display text-2xl">Nothing here yet</p>
              <p className="mt-2 text-muted">Try another category or clear your filters.</p>
              <Button href="/shop" variant="outline" className="mt-7">
                Browse all products
              </Button>
            </div>
          )}
          <Pagination page={page} pages={result.pages} basePath={basePath} params={params} />
        </div>
      </div>
    </div>
  );
}
