'use client';

import { useCommerce, useMoney } from '@/components/site/site-provider';
import { cn, discountPercent } from '@/lib/utils';

type Props = {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
};

export function Price({ price, compareAtPrice, className, size = 'md', showDiscount = false }: Props) {
  const commerce = useCommerce();
  const { format } = useMoney();
  const sizeClass = size === 'lg' ? 'text-2xl md:text-3xl' : size === 'sm' ? 'text-sm' : 'text-base';

  // No fixed price: bespoke / priced per project
  if (price <= 0) {
    return <span className={cn('inline-flex items-baseline font-display text-ink', sizeClass, className)}>{commerce.quoteLabel || 'Request a quote'}</span>;
  }

  const discount = discountPercent(price, compareAtPrice);
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-display', sizeClass, className)}>
      <span className={cn(discount ? 'text-sale' : 'text-ink')}>{format(price)}</span>
      {discount && compareAtPrice ? (
        <>
          <s className="text-muted decoration-muted/60">{format(compareAtPrice)}</s>
          {showDiscount && <span className="font-sans text-xs font-medium tracking-wider text-sale">-{discount}%</span>}
        </>
      ) : null}
    </span>
  );
}
