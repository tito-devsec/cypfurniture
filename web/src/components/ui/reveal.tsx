'use client';

import { useRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Animate direct children one after another. */
  stagger?: number;
  delay?: number;
  y?: number;
  duration?: number;
  /** Scroll position that triggers the animation (ScrollTrigger `start`). */
  start?: string;
  id?: string;
};

/**
 * Fades + slides content in when it scrolls into view (GSAP ScrollTrigger).
 * Children are visible by default (no layout shift / no missing content without JS).
 */
export function Reveal({ children, className, as: Tag = 'div', stagger, delay = 0, y = 32, duration = 1, start = 'top 88%', id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const targets = stagger ? Array.from(el.children) : el;
      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          delay,
          ease: 'power3.out',
          stagger: stagger ?? 0,
          clearProps: 'transform',
          scrollTrigger: { trigger: el, start, once: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  );
}
