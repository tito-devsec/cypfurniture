'use client';

import { Img as Image } from '@/components/ui/img';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Rotate3d, X } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { has3dView } from '@/lib/model3d';
import type { Component3D, ProductImage } from '@/lib/types';
import { Product3D } from '@/components/three/product-3d';
import { cn, resolveImage } from '@/lib/utils';

export function ProductGallery({ images, name, model3d = '', components3d = [] }: { images: ProductImage[]; name: string; model3d?: string; components3d?: Component3D[] }) {
  const list = images.length ? images : [{ url: '', alt: name }];
  const show3d = has3dView(model3d, components3d);
  const [view, setView] = useState<'photos' | '3d'>('photos');
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const lbRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const img = mainRef.current?.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    },
    { dependencies: [active, view], scope: mainRef },
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
      <div ref={mainRef} className={cn('relative flex-1 overflow-hidden bg-surface', view === '3d' ? 'aspect-square' : 'aspect-[4/5] cursor-zoom-in')} onClick={() => view === 'photos' && setLightbox(true)}>
        {view === '3d' && <Product3D model={model3d} components={components3d} name={name} onClose={() => setView('photos')} className="absolute inset-0" />}
        {view === 'photos' && show3d && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setView('3d');
            }}
            className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 bg-white/95 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink shadow-sm transition-colors hover:bg-ink hover:text-white"
          >
            <Rotate3d size={16} strokeWidth={1.8} /> View in 3D
          </button>
        )}
        {view === 'photos' && <Image src={resolveImage(current.url)} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />}
        {view === 'photos' && list.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
            {list.map((_, i) => (
              <span key={i} className={cn('h-1.5 w-1.5 rounded-full bg-white/60', i === active && 'bg-white')} />
            ))}
          </div>
        )}
        {view === 'photos' && list.length > 1 && (
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

      {(list.length > 1 || show3d) && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto lg:w-24 lg:flex-col lg:overflow-visible">
          {show3d && (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setView('3d')}
                className={cn('flex h-24 w-20 flex-col items-center justify-center gap-1.5 bg-surface text-ink ring-1 ring-inset transition lg:h-28 lg:w-24', view === '3d' ? 'ring-ink' : 'ring-transparent hover:ring-line-strong')}
                aria-label="Show the 3D view"
                aria-current={view === '3d'}
              >
                <Rotate3d size={24} strokeWidth={1.4} />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em]">3D view</span>
              </button>
            </li>
          )}
          {list.map((img, i) => (
            <li key={`${img.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setView('photos');
                }}
                className={cn('relative block h-24 w-20 overflow-hidden bg-surface ring-1 ring-inset transition lg:h-28 lg:w-24', view === 'photos' && i === active ? 'ring-ink' : 'ring-transparent hover:ring-line-strong')}
                aria-label={`Show image ${i + 1}`}
                aria-current={view === 'photos' && i === active}
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
