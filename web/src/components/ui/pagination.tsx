import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = { page: number; pages: number; basePath: string; params?: Record<string, string | undefined> };

export function Pagination({ page, pages, basePath, params = {} }: Props) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') sp.set(k, v);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return `${basePath}${s ? `?${s}` : ''}`;
  };
  const windowPages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) windowPages.push(p);

  const item = 'flex h-11 min-w-11 items-center justify-center border border-line px-3 text-sm transition-colors hover:border-ink';

  return (
    <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={item} aria-label="Previous page">
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className={cn(item, 'opacity-40')}>
          <ChevronLeft size={16} />
        </span>
      )}
      {windowPages[0] > 1 && (
        <>
          <Link href={href(1)} className={item}>
            1
          </Link>
          {windowPages[0] > 2 && <span className="px-1 text-muted">…</span>}
        </>
      )}
      {windowPages.map((p) => (
        <Link key={p} href={href(p)} className={cn(item, p === page && 'border-ink bg-ink text-white')} aria-current={p === page ? 'page' : undefined}>
          {p}
        </Link>
      ))}
      {windowPages[windowPages.length - 1] < pages && (
        <>
          {windowPages[windowPages.length - 1] < pages - 1 && <span className="px-1 text-muted">…</span>}
          <Link href={href(pages)} className={item}>
            {pages}
          </Link>
        </>
      )}
      {page < pages ? (
        <Link href={href(page + 1)} className={item} aria-label="Next page">
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={cn(item, 'opacity-40')}>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
