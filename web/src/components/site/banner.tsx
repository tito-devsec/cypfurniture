'use client';

import { Img as Image } from '@/components/ui/img';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { Banner as BannerType } from '@/lib/types';
import { cn, resolveImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { SplitHeading } from '@/components/ui/split-heading';

/** Image + text split section with a GSAP parallax on the image. */
export function SplitBanner({ banner, reverse = false, className }: { banner: BannerType; reverse?: boolean; className?: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const img = root.current?.querySelector('.banner-img');
      if (!img || prefersReducedMotion()) return;
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    },
    { scope: root },
  );

  if (!banner.enabled) return null;

  return (
    <section ref={root} className={cn('container-x', className)}>
      <div className={cn('grid items-center gap-10 lg:grid-cols-2 lg:gap-16', reverse && 'lg:[&>*:first-child]:order-2')}>
        <Reveal className="relative aspect-[4/3] overflow-hidden bg-surface lg:aspect-[5/4]">
          {banner.image && <Image src={resolveImage(banner.image)} alt={banner.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="banner-img scale-[1.18] object-cover" />}
        </Reveal>
        <div className="lg:px-6">
          {banner.eyebrow && (
            <Reveal>
              <p className="eyebrow mb-4">{banner.eyebrow}</p>
            </Reveal>
          )}
          <SplitHeading text={banner.title} className="text-3xl leading-[1.1] md:text-[2.75rem]" />
          {banner.text && (
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted md:text-lg">{banner.text}</p>
            </Reveal>
          )}
          {banner.buttonText && (
            <Reveal delay={0.25}>
              <Button href={banner.buttonLink || '/shop'} variant="outline" magnetic className="mt-9" icon={<ArrowRight size={15} />}>
                {banner.buttonText}
              </Button>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

/** Full-width image banner with centered text overlay and parallax. */
export function FullBanner({ banner, className }: { banner: BannerType; className?: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const img = root.current?.querySelector('.banner-img');
      if (!img || prefersReducedMotion()) return;
      gsap.fromTo(img, { yPercent: -12 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    },
    { scope: root },
  );

  if (!banner.enabled) return null;

  return (
    <section ref={root} className={cn('relative overflow-hidden bg-ink text-white', className)}>
      <div className="absolute inset-0">
        {banner.image && <Image src={resolveImage(banner.image)} alt={banner.title} fill sizes="100vw" className="banner-img scale-[1.25] object-cover opacity-70" />}
        <div className="absolute inset-0 bg-ink/40" />
      </div>
      <div className="container-x relative flex min-h-[460px] flex-col items-center justify-center py-24 text-center md:min-h-[540px]">
        {banner.eyebrow && (
          <Reveal>
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">{banner.eyebrow}</p>
          </Reveal>
        )}
        <SplitHeading text={banner.title} className="max-w-3xl text-4xl leading-[1.05] md:text-6xl" />
        {banner.text && (
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{banner.text}</p>
          </Reveal>
        )}
        {banner.buttonText && (
          <Reveal delay={0.25}>
            <Button href={banner.buttonLink || '/contact'} variant="white" size="lg" magnetic className="mt-10" icon={<ArrowRight size={16} />}>
              {banner.buttonText}
            </Button>
          </Reveal>
        )}
      </div>
    </section>
  );
}
