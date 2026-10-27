'use client';

import Link from 'next/link';
import { useSettings } from './site-provider';
import { cn, resolveImage } from '@/lib/utils';

export function Logo({ onDark = false, className, size = 'md' }: { onDark?: boolean; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { brand } = useSettings();
  const src = onDark && brand.logoOnDarkUrl ? brand.logoOnDarkUrl : brand.logoUrl;
  // The CYP logo is a compact lettermark, so it is shown a little taller than a wide wordmark would be.
  const heights = { sm: 'h-9', md: 'h-12 lg:h-14', lg: 'h-20' };

  if (src) {
    return (
      <Link href="/" className={cn('inline-flex shrink-0 items-center', className)} aria-label={brand.siteName}>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo (may be SVG) */}
        <img src={resolveImage(src)} alt={brand.siteName} className={cn('w-auto object-contain', heights[size])} />
      </Link>
    );
  }

  const text = (brand.logoText || brand.siteName).trim();
  const rest = brand.siteName.toLowerCase().startsWith(text.toLowerCase()) ? brand.siteName.slice(text.length).trim() : '';
  const textSize = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-[26px] lg:text-[30px]';

  return (
    <Link href="/" className={cn('inline-flex shrink-0 flex-col items-center leading-none', className)} aria-label={brand.siteName}>
      <span className={cn('font-display tracking-[0.3em]', textSize, onDark ? 'text-white' : 'text-ink')}>{text.toUpperCase()}</span>
      {rest && <span className={cn('mt-1.5 text-[9px] uppercase tracking-[0.46em]', onDark ? 'text-white/70' : 'text-muted')}>{rest}</span>}
    </Link>
  );
}
