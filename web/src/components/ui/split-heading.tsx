'use client';

import { useRef, type ElementType } from 'react';
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '@/lib/gsap';
import { cn } from '@/lib/utils';

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** When true the animation plays immediately instead of on scroll. */
  immediate?: boolean;
  stagger?: number;
};

/**
 * Splits a heading into masked lines and slides each line up (GSAP SplitText).
 */
export function SplitHeading({ text, as: Tag = 'h2', className, delay = 0, immediate = false, stagger = 0.08 }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      let split: SplitText | undefined;
      let tween: gsap.core.Tween | undefined;
      const run = () => {
        split = SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'line',
          autoSplit: true,
          onSplit(self) {
            tween?.kill();
            tween = gsap.from(self.lines, {
              yPercent: 110,
              opacity: 0,
              duration: 1.1,
              delay,
              stagger,
              ease: 'power4.out',
              ...(immediate ? {} : { scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
            });
            return tween;
          },
        });
        el.classList.remove('gs-hide');
      };
      if (document.fonts?.ready) document.fonts.ready.then(run);
      else run();
      return () => {
        tween?.kill();
        split?.revert();
      };
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <Tag ref={ref} className={cn('gs-hide', className)}>
      {text}
    </Tag>
  );
}
