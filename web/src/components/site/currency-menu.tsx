'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Search } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { currencyName } from '@/lib/currency-flags';
import { cn } from '@/lib/utils';
import { Flag } from './flag';
import { useMoney } from './site-provider';

type Row = { code: string; label: string };

/**
 * Header currency switcher: a flag + code button that opens a "Choose a currency" panel
 * with search, round flags, currency names and a check mark on the active currency.
 */
export function CurrencyMenu({ className }: { className?: string }) {
  const { currency, setCurrency, options, base } = useMoney();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(
    () =>
      [{ code: base.code, label: currencyName(base.code) }, ...options.map((o) => ({ code: o.code, label: o.label || currencyName(o.code) }))].sort((a, b) =>
        a.code.localeCompare(b.code),
      ),
    [base.code, options],
  );
  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((r) => r.code.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)) : rows;
  const current = rows.find((r) => r.code === currency) ?? rows[0];

  // Close when the route changes (state derived from the route, no effect needed)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Open animation + focus the search box
  useGSAP(
    () => {
      if (!open || !panel.current) return;
      gsap.fromTo(panel.current, { opacity: 0, y: -10, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out', clearProps: 'transform' });
      gsap.fromTo(panel.current.querySelectorAll('.cm-row'), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.025, delay: 0.05, ease: 'power3.out' });
      searchRef.current?.focus({ preventScroll: true });
    },
    { dependencies: [open], scope: root },
  );

  if (!options.length || !current) return null;

  const choose = (code: string) => {
    setCurrency(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={root} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-1.5 px-2 text-ink transition-colors hover:text-accent"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Currency: ${current.code}. Choose a currency`}
      >
        <Flag code={current.code} size={20} />
        <span className="font-sans text-[12px] font-medium tracking-[0.12em]">{current.code}</span>
        <ChevronDown size={13} className={cn('transition-transform duration-300', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={() => setOpen(false)} aria-label="Close" />
          <div
            ref={panel}
            role="dialog"
            aria-label="Choose a currency"
            className="fixed inset-x-3 top-4 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(20,20,20,0.35)] ring-1 ring-ink/5 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[70vh] md:w-[350px]"
          >
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface" aria-label="Back">
                <ArrowLeft size={20} strokeWidth={2} />
              </button>
              <h2 className="font-sans text-[17px] font-semibold text-ink">Choose a currency</h2>
            </div>
            <div className="px-4 pb-3 pt-1">
              <label className="flex h-12 items-center gap-3 rounded-xl bg-surface px-4 transition-shadow focus-within:ring-2 focus-within:ring-accent/30">
                <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  aria-label="Search currencies"
                  className="w-full bg-transparent font-sans text-[15px] text-ink placeholder:text-muted focus:outline-none"
                />
              </label>
            </div>
            <ul className="overflow-y-auto px-2 pb-2" role="listbox" aria-label="Currencies">
              {visible.map((row) => {
                const active = row.code === currency;
                return (
                  <li key={row.code} className="cm-row">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => choose(row.code)}
                      className={cn('flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface', active && 'bg-surface/70')}
                    >
                      <Flag code={row.code} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-[15px] font-semibold leading-tight text-ink">{row.code}</span>
                        <span className="block truncate font-sans text-[13px] text-muted">{row.label}</span>
                      </span>
                      {active && <Check size={20} strokeWidth={2.5} className="shrink-0 text-success" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-4 py-8 text-center font-sans text-sm text-muted">No currency matches “{query}”.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
