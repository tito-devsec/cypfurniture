import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/reveal';
import { ProductCard } from './product-card';

export function ProductGrid({ products, columns = 4, className, priorityCount = 0 }: { products: Product[]; columns?: 3 | 4; className?: string; priorityCount?: number }) {
  if (!products.length) return null;
  return (
    <Reveal
      stagger={0.07}
      y={36}
      className={cn('grid grid-cols-2 gap-x-5 gap-y-10 md:gap-x-7', columns === 4 ? 'lg:grid-cols-4 md:grid-cols-3' : 'md:grid-cols-3', className)}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </Reveal>
  );
}
