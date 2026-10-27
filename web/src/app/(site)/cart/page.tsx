'use client';

import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { selectSubtotal, useCart } from '@/lib/cart-store';
import { useHydrated } from '@/lib/use-hydrated';
import { resolveImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useCommerce, useMoney } from '@/components/site/site-provider';

export default function CartPage() {
  const { items, setQuantity, remove, clear } = useCart();
  const subtotal = useCart(selectSubtotal);
  const commerce = useCommerce();
  const { format } = useMoney();
  const mounted = useHydrated();

  const shipping = commerce.freeShippingThreshold > 0 && subtotal >= commerce.freeShippingThreshold ? 0 : commerce.shippingFlatRate;
  const total = subtotal + (items.length ? shipping : 0);

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Your cart</h1>

      {!mounted ? null : items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center border border-dashed border-line px-6 py-24 text-center">
          <ShoppingBag size={40} strokeWidth={1} className="text-muted" />
          <p className="mt-5 font-display text-2xl">Your cart is empty</p>
          <p className="mt-2 text-muted">Discover pieces made for your space.</p>
          <Button href="/shop" className="mt-8" icon={<ArrowRight size={15} />}>
            Start shopping
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.key} className="grid grid-cols-[88px_1fr] gap-5 py-6 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                  <Link href={`/products/${item.slug}`} className="relative aspect-[4/5] overflow-hidden bg-surface">
                    <Image src={resolveImage(item.image)} alt={item.name} fill sizes="110px" className="object-cover" />
                  </Link>
                  <div>
                    <Link href={`/products/${item.slug}`} className="font-display text-lg leading-snug hover:text-accent">
                      {item.name}
                    </Link>
                    {Object.keys(item.options).length > 0 && (
                      <p className="mt-1 text-sm text-muted">
                        {Object.entries(item.options)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-muted">{format(item.price)} each</p>
                    <div className="mt-4 flex items-center gap-4 sm:hidden">
                      <QtyControl value={item.quantity} onChange={(q) => setQuantity(item.key, q)} />
                      <button type="button" onClick={() => remove(item.key)} className="text-muted hover:text-sale" aria-label="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="hidden flex-col items-end gap-3 sm:flex">
                    <span className="font-display text-lg">{format(item.price * item.quantity)}</span>
                    <QtyControl value={item.quantity} onChange={(q) => setQuantity(item.key, q)} />
                    <button type="button" onClick={() => remove(item.key)} className="flex items-center gap-1 text-xs text-muted hover:text-sale">
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between">
              <Link href="/shop" className="link-line text-[12px] font-medium uppercase tracking-[0.18em] text-ink hover:link-line-active">
                Continue shopping
              </Link>
              <button type="button" onClick={clear} className="text-xs text-muted hover:text-sale">
                Clear cart
              </button>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-surface p-7 lg:sticky lg:top-40">
              <h2 className="font-display text-2xl">Order summary</h2>
              <dl className="mt-6 space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{format(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd>{shipping === 0 ? <span className="text-accent">Free</span> : format(shipping)}</dd>
                </div>
                {commerce.freeShippingThreshold > 0 && shipping > 0 && (
                  <p className="text-xs text-muted">Free delivery on orders over {format(commerce.freeShippingThreshold)}.</p>
                )}
                <div className="flex justify-between border-t border-line pt-4 font-display text-xl">
                  <dt>Total</dt>
                  <dd>{format(total)}</dd>
                </div>
              </dl>
              <Button href="/checkout" full size="lg" className="mt-7" icon={<ArrowRight size={15} />}>
                Proceed to checkout
              </Button>
              {commerce.checkoutNote && <p className="mt-4 text-xs leading-relaxed text-muted">{commerce.checkoutNote}</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function QtyControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center border border-line bg-white">
      <button type="button" onClick={() => onChange(value - 1)} className="flex h-10 w-10 items-center justify-center hover:bg-surface" aria-label="Decrease quantity">
        <Minus size={13} />
      </button>
      <span className="w-10 text-center text-sm">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="flex h-10 w-10 items-center justify-center hover:bg-surface" aria-label="Increase quantity">
        <Plus size={13} />
      </button>
    </div>
  );
}
