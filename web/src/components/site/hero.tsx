'use client';

import { Img as Image } from '@/components/ui/img';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { HeroSlide } from '@/lib/types';
import { cn, resolveImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = { slides: HeroSlide[]; autoplaySeconds?: number };

/**
 * Full-bleed hero slider: GSAP cross-fade + slow Ken Burns zoom, staggered text reveal,
 * autoplay with progress indicator, keyboard + swipe navigation.
 */
export function Hero({ slides, autoplaySeconds = 6 }: Props) {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const animating = useRef(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  const animateIn = useCallback((i: number, direction: 1 | -1 = 1) => {
    const el = root.current;
    if (!el) return;
    const slide = el.querySelectorAll<HTMLElement>('.hero-slide')[i];
    if (!slide) return;
    const img = slide.querySelector('.hero-img');
    const parts = slide.querySelectorAll('.hero-text > *');
    gsap.killTweensOf([img, parts]);
    const tl = gsap.timeline();
    tl.fromTo(img, { scale: 1.12, xPercent: direction * 2 }, { scale: 1, xPercent: 0, duration: 7, ease: 'power1.out' }, 0);
    tl.fromTo(parts, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out' }, 0.25);
    return tl;
  }, []);

  const goTo = useCallback(
    (next: number, direction: 1 | -1 = 1) => {
      const el = root.current;
      if (!el || count < 2 || animating.current) return;
      const current = indexRef.current;
      const target = (next + count) % count;
      if (target === current) return;
      animating.current = true;
      const slidesEl = el.querySelectorAll<HTMLElement>('.hero-slide');
      const from = slidesEl[current];
      const to = slidesEl[target];
      gsap.set(to, { zIndex: 2, autoAlpha: 0 });
      gsap.set(from, { zIndex: 1 });
      gsap.to(from.querySelectorAll('.hero-text > *'), { y: -20, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.in' });
      gsap.to(to, {
        autoAlpha: 1,
        duration: 1.1,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(from, { autoAlpha: 0, zIndex: 0 });
          animating.current = false;
        },
      });
      animateIn(target, direction);
      indexRef.current = target;
      setIndex(target);
    },
    [animateIn, count],
  );

  // Initial reveal
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const slidesEl = el.querySelectorAll<HTMLElement>('.hero-slide');
      slidesEl.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, zIndex: i === 0 ? 1 : 0 }));
      if (prefersReducedMotion()) {
        gsap.set(el.querySelectorAll('.hero-text > *'), { opacity: 1, y: 0 });
        return;
      }
      animateIn(0);
    },
    { scope: root },
  );

  // Autoplay
  useEffect(() => {
    if (count < 2 || !autoplaySeconds || prefersReducedMotion()) return;
    const id = setInterval(() => goTo(indexRef.current + 1), autoplaySeconds * 1000);
    return () => clearInterval(id);
  }, [count, autoplaySeconds, goTo, index]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(indexRef.current + 1);
      if (e.key === 'ArrowLeft') goTo(indexRef.current - 1, -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  if (count === 0) return null;

  return (
    <section
      ref={root}
      className="relative h-[78vh] min-h-[520px] max-h-[860px] w-full overflow-hidden bg-ink"
      aria-roledescription="carousel"
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) goTo(indexRef.current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      {slides.map((slide, i) => {
        const dark = slide.theme === 'dark';
        return (
          <div key={slide.id || i} className="hero-slide absolute inset-0 invisible" aria-hidden={i !== index}>
            <div className="hero-img absolute inset-0 will-change-transform">
              {slide.image && <Image src={resolveImage(slide.image)} alt={slide.title} fill priority={i === 0} sizes="100vw" className="object-cover" />}
              <div className={cn('absolute inset-0', dark ? 'bg-gradient-to-r from-ink/70 via-ink/30 to-transparent' : 'bg-gradient-to-r from-white/80 via-white/40 to-transparent')} />
            </div>
            <div className="container-x relative flex h-full items-center">
              <div className={cn('hero-text max-w-2xl', slide.align === 'center' && 'mx-auto text-center', dark ? 'text-white' : 'text-ink')}>
                {slide.eyebrow && <p className={cn('mb-5 text-[11px] font-medium uppercase tracking-[0.28em]', dark ? 'text-white/80' : 'text-muted')}>{slide.eyebrow}</p>}
                <h1 className="text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.75rem]">{slide.title}</h1>
                {slide.subtitle && <p className={cn('mt-6 max-w-lg text-base leading-relaxed sm:text-lg', dark ? 'text-white/85' : 'text-ink-soft', slide.align === 'center' && 'mx-auto')}>{slide.subtitle}</p>}
                <div className={cn('mt-9 flex flex-wrap gap-3', slide.align === 'center' && 'justify-center')}>
                  {slide.ctaText && (
                    <Button href={slide.ctaLink || '/shop'} variant={dark ? 'white' : 'primary'} size="lg" magnetic icon={<ArrowRight size={16} />}>
                      {slide.ctaText}
                    </Button>
                  )}
                  {slide.secondaryText && (
                    <Button href={slide.secondaryLink || '/about'} variant="ghost" size="lg" className={cn(dark ? 'text-white hover:bg-white/10' : 'hover:bg-ink/5')}>
                      {slide.secondaryText}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="container-x pointer-events-none absolute inset-x-0 bottom-8 z-10 flex items-end justify-between">
            <div className="pointer-events-auto flex items-center gap-3">
              {slides.map((s, i) => (
                <button
                  key={s.id || i}
                  type="button"
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  className="group relative h-6 w-12"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                >
                  <span className={cn('absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/40 transition-colors group-hover:bg-white/70', i === index && 'bg-white')} />
                  {i === index && autoplaySeconds > 0 && (
                    <span key={`${i}-${index}`} className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 origin-left bg-white animate-[hero-progress_linear_forwards]" style={{ animationDuration: `${autoplaySeconds}s` }} />
                  )}
                </button>
              ))}
              <span className="ml-2 font-display text-sm text-white/80">
                {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </span>
            </div>
            <div className="pointer-events-auto hidden items-center gap-2 sm:flex">
              <button type="button" onClick={() => goTo(index - 1, -1)} className="flex h-11 w-11 items-center justify-center border border-white/40 text-white transition-colors hover:bg-white hover:text-ink" aria-label="Previous slide">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => goTo(index + 1, 1)} className="flex h-11 w-11 items-center justify-center border border-white/40 text-white transition-colors hover:bg-white hover:text-ink" aria-label="Next slide">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
