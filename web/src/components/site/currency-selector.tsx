'use client';

import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMoney } from './site-provider';

/** Compact currency switcher for the top bar. Prices across the site follow the choice (remembered in a cookie). */
export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency, options, base } = useMoney();
  if (!options.length) return null;
  return (
    <label className={cn('relative inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]', className)} title="Display currency">
      <Globe size={13} aria-hidden="true" />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Display currency"
        className="cursor-pointer appearance-none bg-transparent pr-4 text-current focus:outline-none"
      >
        <option value={base.code} className="text-ink">
          {base.code}
        </option>
        {options.map((o) => (
          <option key={o.code} value={o.code} className="text-ink">
            {o.code}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-0" aria-hidden="true" />
    </label>
  );
}
