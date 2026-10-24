import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { CategoryNode } from '@/lib/types';
import { cn, resolveImage } from '@/lib/utils';
import { Reveal } from '@/components/ui/reveal';

export function CategoryGrid({ categories }: { categories: CategoryNode[] }) {
  const items = categories.filter((c) => c.isActive).slice(0, 6);
  if (!items.length) return null;
  const featured = items.length >= 3;
  // Layout: one tall tile on the left, two stacked on the right, then up to three in a row.
  const span = (i: number) => {
    if (!featured) return 'aspect-[4/5]';
    if (i === 0) return 'md:col-span-3 md:row-span-2 aspect-[4/5] md:aspect-auto';
    if (i <= 2) return 'md:col-span-3 aspect-[16/10]';
    return items.length - 3 === 2 ? 'md:col-span-3 aspect-[16/10]' : 'md:col-span-2 aspect-[4/3]';
  };
  return (
    <Reveal stagger={0.1} y={40} className={cn('grid gap-4 md:gap-5', featured ? 'md:grid-cols-6' : 'md:grid-cols-3')}>
      {items.map((c, i) => {
        return (
          <Link key={c.id} href={`/category/${c.slug}`} className={cn('group relative block overflow-hidden bg-surface', span(i))}>
            {c.imageUrl && <Image src={resolveImage(c.imageUrl)} alt={c.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="img-zoom object-cover group-hover:scale-105" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white md:p-7">
              <div>
                <h3 className="font-display text-2xl md:text-3xl">{c.name}</h3>
                <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-white/80">
                  {c.productCount} {c.productCount === 1 ? 'product' : 'products'}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-all duration-500 group-hover:rotate-45 group-hover:bg-white group-hover:text-ink">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
        );
      })}
    </Reveal>
  );
}
