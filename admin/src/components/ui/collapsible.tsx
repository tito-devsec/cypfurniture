'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

/** Height-animated container (GSAP). */
export function Collapsible({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.to(el, { height: open ? 'auto' : 0, duration: 0.45, ease: 'power3.inOut', overwrite: true });
    },
    { dependencies: [open], scope: ref },
  );
  return (
    <div ref={ref} className={cn('h-0 overflow-hidden', className)} aria-hidden={!open}>
      {children}
    </div>
  );
}

export type AccordionItem = { id: string; title: string; content: ReactNode };

/** Accordion built on Collapsible. */
export function Accordion({ items, defaultOpen, className }: { items: AccordionItem[]; defaultOpen?: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? items[0]?.id ?? null);
  return (
    <div className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between py-5 text-left font-display text-lg text-ink transition-colors hover:text-accent"
              aria-expanded={isOpen}
            >
              {item.title}
              <ChevronDown size={18} className={cn('shrink-0 text-muted transition-transform duration-300', isOpen && 'rotate-180')} />
            </button>
            <Collapsible open={isOpen}>
              <div className="pb-6">{item.content}</div>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}
