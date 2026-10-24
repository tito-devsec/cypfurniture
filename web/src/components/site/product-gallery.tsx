'use client';

import { Img as Image } from '@/components/ui/img';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import type { ProductImage } from '@/lib/types';
import { cn, resolveImage } from '@/lib/utils';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const list = images.length ? images : [{ url: '', alt: name }];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const lbRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!mainRef.current) return;
      gsap.fromTo(mainRef.current.querySelector('img'), { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    },
    { dependencies: [active], scope: mainRef },
  );

  useGSAP(
    () => {
      if (!lbRef.current) return;
      gsap.fromTo(lbRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      gsap.fromTo(lbRef.current.querySelector('.lb-img'), { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' });
    },
    { dependencies: [lightbox, active], scope: lbRef },
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % list.length);
      if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, list.length]);

  const current = list[active];

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse">
      <div ref={mainRef} className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden bg-surface" onClick={() => setLightbox(true)}>
        <Image src={resolveImage(current.url)} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
            {list.map((_, i) => (
              <span key={i} className={cn('h-1.5 w-1.5 rounded-full bg-white/60', i === active && 'bg-white')} />
            ))}
          </div>
        )}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActive((a) => (a - 1 + list.length) % list.length);
              }}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 lg:hidden"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActive((a) => (a + 1) % list.length);
              }}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-ink lg:hidden"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto lg:w-24 lg:flex-col lg:overflow-visible">
          {list.map((img, i) => (
            <li key={`${img.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn('relative block h-24 w-20 overflow-hidden bg-surface ring-1 ring-inset transition lg:h-28 lg:w-24', i === active ? 'ring-ink' : 'ring-transparent hover:ring-line-strong')}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active}
              >
                <Image src={resolveImage(img.url)} alt={img.alt || name} fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div ref={lbRef} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 p-4" role="dialog" aria-label="Image viewer" onClick={() => setLightbox(false)}>
          <button type="button" className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center text-white" aria-label="Close" onClick={() => setLightbox(false)}>
            <X size={26} strokeWidth={1.5} />
          </button>
          {list.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a - 1 + list.length) % list.length);
                }}
              >
                <ChevronLeft size={30} strokeWidth={1.2} />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a + 1) % list.length);
                }}
              >
                <ChevronRight size={30} strokeWidth={1.2} />
              </button>
            </>
          )}
          <div className="lb-img relative h-[85vh] w-[92vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={resolveImage(current.url)} alt={current.alt || name} fill sizes="92vw" className="object-contain" />
          </div>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-display text-sm text-white/70">
            {active + 1} / {list.length}
          </p>
        </div>
      )}
    </div>
  );
}
