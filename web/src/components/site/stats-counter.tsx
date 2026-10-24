'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import type { Stat } from '@/lib/types';

/** Stats row whose numbers count up when scrolled into view (GSAP). */
export function StatsCounter({ stats }: { stats: Stat[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current || prefersReducedMotion()) return;
      root.current.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const raw = el.dataset.count || '';
        const match = raw.match(/^([^\d]*)([\d,.]+)(.*)$/);
        if (!match) return;
        const [, prefix, numStr, suffix] = match;
        const target = Number(numStr.replace(/,/g, ''));
        if (!Number.isFinite(target)) return;
        const useComma = numStr.includes(',');
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            const n = Math.round(obj.v);
            el.textContent = `${prefix}${useComma ? n.toLocaleString('en-US') : n}${suffix}`;
          },
        });
      });
    },
    { scope: root },
  );

  if (!stats.length) return null;

  return (
    <div ref={root} className="grid grid-cols-2 gap-y-10 border-y border-line py-12 md:grid-cols-4">
      {stats.map((s, i) => (
        <div key={`${s.label}-${i}`} className="text-center">
          <p className="font-display text-4xl text-ink md:text-5xl" data-count={s.value}>
            {s.value}
          </p>
          <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-muted">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
