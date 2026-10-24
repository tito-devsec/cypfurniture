'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { cn } from '@/lib/utils';

/** Infinite horizontal ticker driven by GSAP (pauses on hover). */
export function Marquee({ items, className, speed = 60 }: { items: string[]; className?: string; speed?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const list = [...items, ...items];

  useGSAP(
    () => {
      const track = root.current?.querySelector<HTMLElement>('.mq-track');
      if (!track || prefersReducedMotion()) return;
      const width = track.scrollWidth / 2;
      const tween = gsap.to(track, { x: -width, duration: width / speed, ease: 'none', repeat: -1 });
      const pause = () => tween.pause();
      const play = () => tween.play();
      root.current?.addEventListener('mouseenter', pause);
      root.current?.addEventListener('mouseleave', play);
      return () => {
        root.current?.removeEventListener('mouseenter', pause);
        root.current?.removeEventListener('mouseleave', play);
      };
    },
    { scope: root, dependencies: [items.length] },
  );

  if (!items.length) return null;

  return (
    <div ref={root} className={cn('overflow-hidden border-y border-line py-5', className)} aria-hidden="true">
      <div className="mq-track flex w-max items-center gap-10 whitespace-nowrap">
        {list.map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-lg uppercase tracking-[0.22em] text-ink">
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
