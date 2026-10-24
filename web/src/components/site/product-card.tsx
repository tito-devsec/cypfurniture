'use client';

import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { cn, discountPercent, resolveImage } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { useCommerce } from './site-provider';

export function ProductCard({ product, priority = false, className }: { product: Product; priority?: boolean; className?: string }) {
  const add = useCart((s) => s.add);
  const commerce = useCommerce();
  const [first, second] = product.images;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const hasOptions = product.options.length > 0 || product.colors.length > 1;
  const outOfStock = commerce.showStock && product.stock <= 0;

  const quickAdd = () => {
    add({ productId: product.id, name: product.name, slug: product.slug, price: product.price, image: first?.url ?? '', options: {}, stock: product.stock });
  };

  return (
    <article className={cn('group flex flex-col', className)}>
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-surface">
        <Image
          src={resolveImage(first?.url)}
          alt={first?.alt || product.name}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          className={cn('img-zoom object-cover', second ? 'group-hover:opacity-0' : 'group-hover:scale-105')}
        />
        {second && (
          <Image
            src={resolveImage(second.url)}
            alt={second.alt || product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="img-zoom scale-105 object-cover opacity-0 transition-opacity duration-700 group-hover:scale-100 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount && <Badge tone="sale">-{discount}%</Badge>}
          {product.isNew && <Badge tone="ink">New</Badge>}
          {product.isBestSeller && <Badge tone="surface">Best seller</Badge>}
          {outOfStock && <Badge tone="muted">Made to order</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          {product.category && <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted">{product.category.name}</p>}
          <h3 className="font-display text-[17px] leading-snug">
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-accent">
              {product.name}
            </Link>
          </h3>
          <Price price={product.price} compareAtPrice={product.compareAtPrice} className="mt-1.5" />
        </div>
        {hasOptions ? (
          <Link href={`/products/${product.slug}`} className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ink transition-all hover:border-ink hover:bg-ink hover:text-white" aria-label={`Choose options for ${product.name}`} title="Choose options">
            <ShoppingBag size={16} strokeWidth={1.5} />
          </Link>
        ) : (
          <button type="button" onClick={quickAdd} className="flex h-10 w-10 shrink-0 items-center justify-center border border-line text-ink transition-all hover:border-ink hover:bg-ink hover:text-white" aria-label={`Add ${product.name} to cart`} title="Add to cart">
            <ShoppingBag size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </article>
  );
}
