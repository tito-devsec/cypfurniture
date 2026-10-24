'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

/**
 * Re-mounts on every navigation, so each page gets a GSAP enter transition.
 */
export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      gsap.fromTo(ref.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform', onComplete: () => ScrollTrigger.refresh() });
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
