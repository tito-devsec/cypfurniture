'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { useCart } from '@/lib/cart-store';
import type { Product } from '@/lib/types';
import { cn, discountPercent, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon, FeatureIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { useMoney, useSite } from './site-provider';

export function ProductPurchase({ product }: { product: Product }) {
  const { settings } = useSite();
  const { commerce, contact, brand } = settings;
  const { format } = useMoney();
  const add = useCart((s) => s.add);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(Math.max(1, commerce.minOrderQuantity || 1));
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (product.colors.length) init.Color = product.colors[0].name;
    for (const o of product.options) if (o.values.length) init[o.name] = o.values[0];
    return init;
  });

  const onRequest = product.price <= 0; // bespoke / priced per project
  const discount = discountPercent(product.price, product.compareAtPrice);
  const lowStock = commerce.showStock && product.stock > 0 && product.stock <= commerce.lowStockThreshold;
  const madeToOrder = commerce.showStock && product.stock <= 0;
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/products/${product.slug}`;

  const onAdd = () => {
    add({ productId: product.id, name: product.name, slug: product.slug, price: product.price, image: product.images[0]?.url ?? '', options: selected, stock: product.stock }, qty);
    setAdded(true);
    if (btnRef.current) gsap.fromTo(btnRef.current, { scale: 0.96 }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)' });
    window.setTimeout(() => setAdded(false), 2200);
  };

  const waText = [
    onRequest ? `Hello ${brand.siteName}, I would like a quotation for:` : `Hello ${brand.siteName}, I would like to order:`,
    `• ${product.name}${product.sku ? ` (${product.sku})` : ''}`,
    ...Object.entries(selected).map(([k, v]) => `  ${k}: ${v}`),
    onRequest ? '' : `  Quantity: ${qty}`,
    onRequest ? '' : `  Price: ${format(product.price)}`,
    productUrl,
  ]
    .filter(Boolean)
    .join('\n');
  const waLink = contact.whatsapp ? whatsappLink(contact.whatsapp, waText) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {product.category && <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{product.category.name}</span>}
        {product.isNew && <Badge tone="ink">New</Badge>}
        {product.isBestSeller && <Badge tone="accent2">Best seller</Badge>}
        {onRequest && <Badge tone="surface">Bespoke</Badge>}
        {discount && <Badge tone="sale">Save {discount}%</Badge>}
      </div>
      <h1 className="mt-3 text-3xl leading-[1.1] md:text-[2.6rem]">{product.name}</h1>
      {product.sku && <p className="mt-2 text-xs tracking-[0.1em] text-muted">SKU {product.sku}</p>}
      <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" className="mt-5" />
      {product.shortDescription && <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">{product.shortDescription}</p>}

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            Colour: <span className="text-ink">{selected.Color}</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, Color: c.name }))}
                className={cn('h-9 w-9 rounded-full border-2 p-[3px] transition', selected.Color === c.name ? 'border-ink' : 'border-transparent hover:border-line-strong')}
                aria-label={c.name}
                aria-pressed={selected.Color === c.name}
                title={c.name}
              >
                <span className="block h-full w-full rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {product.options.map((option) => (
        <div key={option.name} className="mt-7">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            {option.name}: <span className="text-ink">{selected[option.name]}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                className={cn('border px-4 py-2.5 text-[13px] transition-colors', selected[option.name] === value ? 'border-ink bg-ink text-white' : 'border-line text-ink hover:border-ink')}
                aria-pressed={selected[option.name] === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      {onRequest ? (
        <div className="mt-9 flex flex-col gap-3">
          {waLink && (
            <Button href={waLink} external variant="whatsapp" size="lg" full icon={<WhatsAppIcon size={18} />} iconPosition="left">
              {commerce.quoteLabel || 'Request a quote'} on WhatsApp
            </Button>
          )}
          <Button href="/contact" variant={waLink ? 'outline' : 'primary'} size="lg" full icon={<ArrowRight size={15} />}>
            Request a custom design
          </Button>
          <p className="text-[13px] leading-relaxed text-muted">This piece is made to your dimensions, materials and finishes. Tell us about your space and we will prepare a design and quotation.</p>
        </div>
      ) : (
        <>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div className="flex h-14 w-full items-center justify-between border border-line sm:w-36">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-full w-12 items-center justify-center hover:bg-surface" aria-label="Decrease quantity">
                <Minus size={14} />
              </button>
              <span className="font-display text-lg">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="flex h-full w-12 items-center justify-center hover:bg-surface" aria-label="Increase quantity">
                <Plus size={14} />
              </button>
            </div>
            <Button ref={btnRef} size="lg" full onClick={onAdd} icon={added ? <Check size={16} /> : <ShoppingBag size={16} />} iconPosition="left" className={cn('sm:flex-1', added && 'bg-accent')}>
              {added ? 'Added to cart' : 'Add to cart'}
            </Button>
          </div>

          {commerce.orderWhatsappEnabled && waLink && (
            <Button href={waLink} external variant="whatsapp" size="lg" full className="mt-3" icon={<WhatsAppIcon size={18} />} iconPosition="left">
              Order via WhatsApp
            </Button>
          )}

          {commerce.showStock && (
            <p className={cn('mt-5 flex items-center gap-2 text-[13px]', madeToOrder ? 'text-muted' : lowStock ? 'text-warning' : 'text-success')}>
              <span className={cn('h-2 w-2 rounded-full', madeToOrder ? 'bg-muted' : lowStock ? 'bg-warning' : 'bg-success')} />
              {madeToOrder ? 'Made to order' : lowStock ? `Only ${product.stock} left in stock` : 'In stock · ready to deliver'}
            </p>
          )}
        </>
      )}

      {settings.features.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-7">
          {settings.features.slice(0, 4).map((f, i) => (
            <li key={`${f.title}-${i}`} className="flex items-start gap-3">
              <FeatureIcon name={f.icon} size={20} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-[13px] font-medium text-ink">{f.title}</p>
                <p className="text-xs text-muted">{f.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
