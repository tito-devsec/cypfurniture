'use client';

import { useState } from 'react';
import { flagSrc } from '@/lib/currency-flags';
import { cn } from '@/lib/utils';

/** Round country flag for a currency code, with a neutral fallback when no flag exists. */
export function Flag({ code, size = 24, className }: { code: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = flagSrc(code);

  if (!src || failed) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-surface font-sans font-medium uppercase text-muted', className)}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.32) }}
        aria-hidden="true"
      >
        {code.slice(0, 2)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG from /public, no optimisation needed
    <img src={src} alt="" width={size} height={size} draggable={false} onError={() => setFailed(true)} className={cn('shrink-0 rounded-full', className)} style={{ width: size, height: size }} />
  );
}
