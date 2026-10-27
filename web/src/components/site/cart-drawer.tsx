'use client';

import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { selectSubtotal, useCart } from '@/lib/cart-store';
import { formatPrice, resolveImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCommerce } from './site-provider';

export function CartDrawer() {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const { items, isOpen, close, setQuantity, remove } = useCart();
  const subtotal = useCart(selectSubtotal);
  const commerce = useCommerce();
  const pathname = usePathname();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      tl.current = gsap
        .timeline({ paused: true })
        .set(el, { autoAlpha: 1 })
        .fromTo(el.querySelector('.cd-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(el.querySelector('.cd-panel'), { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'power4.out' }, '<');
    },
    { scope: root },
  );

  useEffect(() => {
    if (!tl.current) return;
    if (isOpen) {
      tl.current.play();
      document.body.style.overflow = 'hidden';
    } else {
      tl.current.reverse();
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // close when navigating
  useEffect(() => {
    close();
  }, [pathname, close]);

  const remaining = commerce.freeShippingThreshold > 0 ? Math.max(0, commerce.freeShippingThreshold - subtotal) : 0;
  const progress = commerce.freeShippingThreshold > 0 ? Math.min(100, (subtotal / commerce.freeShippingThreshold) * 100) : 0;

  return (
    <div ref={root} className="invisible fixed inset-0 z-[80]" aria-hidden={!isOpen} role="dialog" aria-label="Shopping cart">
      <button type="button" className="cd-backdrop absolute inset-0 bg-ink/40" onClick={close} aria-label="Close cart" />
      <div className="cd-panel absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-white">
        <div className="flex h-[72px] items-center justify-between border-b border-line px-6">
          <h2 className="font-display text-xl">Your cart</h2>
          <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center" aria-label="Close cart">
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {commerce.freeShippingThreshold > 0 && items.length > 0 && (
          <div className="border-b border-line px-6 py-4">
            <p className="text-xs text-muted">
              {remaining > 0 ? (
                <>
                  Add <span className="text-ink">{formatPrice(remaining, commerce)}</span> more for free delivery
                </>
              ) : (
                <span className="text-accent">You qualify for free delivery</span>
              )}
            </p>
            <div className="mt-2 h-[3px] w-full bg-line">
              <div className="h-full bg-accent-2 transition-[width] duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag size={36} strokeWidth={1} className="text-muted" />
              <p className="mt-4 font-display text-lg">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted">Discover pieces made for your space.</p>
              <Button href="/shop" variant="outline" size="sm" className="mt-6" onClick={close}>
                Start shopping
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link href={`/products/${item.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden bg-surface">
                    <Image src={resolveImage(item.image)} alt={item.name} fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/products/${item.slug}`} className="font-display text-[15px] leading-snug text-ink hover:text-accent">
                        {item.name}
                      </Link>
                      <button type="button" onClick={() => remove(item.key)} className="text-muted hover:text-sale" aria-label="Remove">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {Object.keys(item.options).length > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        {Object.entries(item.options)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button type="button" onClick={() => setQuantity(item.key, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center hover:bg-surface" aria-label="Decrease">
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => setQuantity(item.key, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center hover:bg-surface" aria-label="Increase">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-display text-[15px]">{formatPrice(item.price * item.quantity, commerce)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.14em] text-muted">Subtotal</span>
              <span className="font-display text-xl">{formatPrice(subtotal, commerce)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Delivery calculated at checkout.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button href="/cart" variant="outline" onClick={close}>
                View cart
              </Button>
              <Button href="/checkout" onClick={close}>
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
