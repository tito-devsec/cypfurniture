'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

/** Horizontal, snap-scrolling product row with GSAP-animated arrow navigation. */
export function ProductCarousel({ products }: { products: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  if (!products.length) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    gsap.to(el, { scrollLeft: el.scrollLeft + dir * step * 2, duration: 0.7, ease: 'power3.out' });
  };

  return (
    <div className="relative">
      <div ref={track} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 md:gap-6 lg:-mx-12 lg:px-12">
        {products.map((p) => (
          <div key={p.id} data-card className="w-[70%] shrink-0 snap-start sm:w-[44%] lg:w-[30%] xl:w-[23%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={() => scrollBy(-1)} className="flex h-11 w-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white" aria-label="Scroll left">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={() => scrollBy(1)} className="flex h-11 w-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white" aria-label="Scroll right">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
