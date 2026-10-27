'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { CategoryNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMoney } from './site-provider';

type Props = { categories: CategoryNode[]; activeSlug?: string; priceRange: { min: number; max: number } };

export function ShopFilters({ categories, activeSlug, priceRange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { format, base } = useMoney();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(sp.get('minPrice') ?? '');
  const [max, setMax] = useState(sp.get('maxPrice') ?? '');

  const update = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    params.delete('page');
    const s = params.toString();
    router.push(`${pathname}${s ? `?${s}` : ''}`);
  };

  const categoryHref = (slug?: string) => {
    const params = new URLSearchParams(sp.toString());
    params.delete('page');
    params.delete('q');
    const s = params.toString();
    return `${slug ? `/category/${slug}` : '/shop'}${s ? `?${s}` : ''}`;
  };

  const applyPrice = (e: FormEvent) => {
    e.preventDefault();
    update({ minPrice: min, maxPrice: max });
  };

  const flags = [
    { key: 'sale', label: 'On sale' },
    { key: 'new', label: 'New arrivals' },
    { key: 'bestseller', label: 'Best sellers' },
  ];
  const hasFilters = ['sale', 'new', 'bestseller', 'minPrice', 'maxPrice', 'q'].some((k) => sp.get(k)) || Boolean(activeSlug);

  const heading = 'mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-ink';

  return (
    <aside className="lg:sticky lg:top-36 lg:self-start">
      <button type="button" onClick={() => setOpen((v) => !v)} className="mb-6 flex w-full items-center justify-between border border-line px-4 py-3 text-[12px] font-medium uppercase tracking-[0.16em] lg:hidden">
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} /> Filters
        </span>
        {open ? <X size={16} /> : null}
      </button>

      <div className={cn('space-y-10', !open && 'hidden lg:block')}>
        <div>
          <h3 className={heading}>Categories</h3>
          <ul className="space-y-1 text-[15px]">
            <li>
              <Link href={categoryHref()} className={cn('link-line hover:text-ink', !activeSlug ? 'link-line-active text-ink' : 'text-muted')}>
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id} className="pt-1">
                <Link href={categoryHref(c.slug)} className={cn('link-line font-display text-base hover:text-ink', activeSlug === c.slug ? 'link-line-active text-ink' : 'text-ink-soft')}>
                  {c.name}
                </Link>
                {c.children.length > 0 && (
                  <ul className="mt-1 space-y-1 border-l border-line pl-4">
                    {c.children.map((ch) => (
                      <li key={ch.id} className="flex items-center justify-between">
                        <Link href={categoryHref(ch.slug)} className={cn('link-line text-[14px] hover:text-ink', activeSlug === ch.slug ? 'link-line-active text-ink' : 'text-muted')}>
                          {ch.name}
                        </Link>
                        <span className="text-xs text-muted/70">{ch.productCount}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={applyPrice}>
          <h3 className={heading}>Price</h3>
          <p className="mb-3 text-xs text-muted">
            {format(priceRange.min)} – {format(priceRange.max)}
            <span className="block">Enter amounts in {base.code}</span>
          </p>
          <div className="flex items-center gap-2">
            <input type="number" min={0} inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} className="h-10 w-full border border-line px-3 text-sm focus:border-ink focus:outline-none" aria-label="Minimum price" />
            <span className="text-muted">–</span>
            <input type="number" min={0} inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} className="h-10 w-full border border-line px-3 text-sm focus:border-ink focus:outline-none" aria-label="Maximum price" />
          </div>
          <button type="submit" className="mt-3 h-10 w-full border border-ink text-[11px] font-medium uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-white">
            Apply
          </button>
        </form>

        <div>
          <h3 className={heading}>Highlights</h3>
          <ul className="space-y-2.5">
            {flags.map((f) => {
              const checked = sp.get(f.key) === '1';
              return (
                <li key={f.key}>
                  <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink-soft">
                    <input type="checkbox" checked={checked} onChange={() => update({ [f.key]: checked ? null : '1' })} className="h-4 w-4 accent-accent" />
                    {f.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {hasFilters && (
          <Link href="/shop" className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted hover:text-ink">
            <X size={13} /> Clear all filters
          </Link>
        )}
      </div>
    </aside>
  );
}

export function ShopToolbar({ total, from, to }: { total: number; from: number; to: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const sort = sp.get('sort') || 'newest';
  const onSort = (value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value === 'newest') params.delete('sort');
    else params.set('sort', value);
    params.delete('page');
    const s = params.toString();
    router.push(`${pathname}${s ? `?${s}` : ''}`);
  };
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
      <p className="text-sm text-muted">
        {total === 0 ? 'No products found' : `Showing ${from}–${to} of ${total} products`}
      </p>
      <label className="flex items-center gap-3 text-sm">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Sort by</span>
        <select value={sort} onChange={(e) => onSort(e.target.value)} className="h-10 border border-line bg-white px-3 text-sm focus:border-ink focus:outline-none">
          <option value="newest">Newest</option>
          <option value="popular">Most popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>
    </div>
  );
}
