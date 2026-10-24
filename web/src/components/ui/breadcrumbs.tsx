import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-[12px] uppercase tracking-[0.14em] text-muted', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="transition-colors hover:text-ink">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            <li aria-hidden="true">
              <ChevronRight size={12} />
            </li>
            <li className={cn(i === items.length - 1 && 'text-ink')} aria-current={i === items.length - 1 ? 'page' : undefined}>
              {item.href && i !== items.length - 1 ? (
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span className="line-clamp-1">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
