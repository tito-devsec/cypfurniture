import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from '@/components/ui/breadcrumbs';
import { Accordion } from '@/components/ui/collapsible';
import { Markdown } from '@/components/ui/markdown';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/ui/reveal';
import { ProductGallery } from '@/components/site/product-gallery';
import { ProductPurchase } from '@/components/site/product-purchase';
import { ProductGrid } from '@/components/site/product-grid';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: 'Product not found' };
  const { product } = data;
  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: { title: product.name, description: product.shortDescription, images: product.images[0] ? [resolveImage(product.images[0].url)] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product, related } = data;

  const crumbs: Crumb[] = [{ label: 'Shop', href: '/shop' }];
  if (product.category?.parent) crumbs.push({ label: product.category.parent.name, href: `/category/${product.category.parent.slug}` });
  if (product.category) crumbs.push({ label: product.category.name, href: `/category/${product.category.slug}` });
  crumbs.push({ label: product.name });

  const specRows = [
    product.dimensions ? { label: 'Dimensions', value: product.dimensions } : null,
    product.materials ? { label: 'Materials', value: product.materials } : null,
    ...product.specs,
    product.sku ? { label: 'SKU', value: product.sku } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const accordion = [
    product.description
      ? { id: 'description', title: 'Description', content: <Markdown content={product.description} small /> }
      : null,
    specRows.length
      ? {
          id: 'specs',
          title: 'Specifications',
          content: (
            <dl className="divide-y divide-line text-[15px]">
              {specRows.map((row, i) => (
                <div key={`${row.label}-${i}`} className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-muted">{row.label}</dt>
                  <dd className="text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          ),
        }
      : null,
    {
      id: 'delivery',
      title: 'Delivery & returns',
      content: (
        <div className="prose-cyp prose-cyp-sm">
          <p>Every order is delivered and assembled by our own team. In-stock items ship within a few working days; made-to-order pieces take a little longer.</p>
          <p>
            Read our full <Link href="/p/shipping-delivery">shipping &amp; delivery</Link> and <Link href="/p/returns-warranty">returns &amp; warranty</Link> policies.
          </p>
        </div>
      ),
    },
  ].filter(Boolean) as { id: string; title: string; content: React.ReactNode }[];

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={crumbs} />

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.name} />
        </div>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-40">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      <Reveal className="mt-16 max-w-3xl lg:mt-24">
        <Accordion items={accordion} />
      </Reveal>

      {product.tags.length > 0 && (
        <Reveal className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Tags</span>
          {product.tags.map((tag) => (
            <Link key={tag} href={`/shop?q=${encodeURIComponent(tag)}`} className="border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-ink">
              {tag}
            </Link>
          ))}
        </Reveal>
      )}

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-16 lg:mt-28 lg:pt-20">
          <SectionHeading eyebrow="Complete the look" title="You may also like" action={{ label: 'View all', href: product.category ? `/category/${product.category.slug}` : '/shop' }} />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
