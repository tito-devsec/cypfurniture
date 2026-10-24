'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useSessionValue } from '@/lib/use-hydrated';
import type { Order } from '@/lib/types';
import { formatPrice, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useSite } from '@/components/site/site-provider';

function SuccessContent() {
  const sp = useSearchParams();
  const { settings } = useSite();
  const { commerce, contact, brand } = settings;
  const raw = useSessionValue('cyp_last_order');
  const order = useMemo<Order | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Order;
    } catch {
      return null;
    }
  }, [raw]);
  const root = useRef<HTMLDivElement>(null);
  const orderNumber = sp.get('order') || order?.orderNumber || '';

  useGSAP(
    () => {
      if (!root.current) return;
      gsap.fromTo(root.current.querySelector('.ok-circle'), { scale: 0 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' });
      gsap.fromTo(root.current.querySelectorAll('.ok-item'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, delay: 0.2 });
    },
    { scope: root },
  );

  const waText = order
    ? [
        `Hello ${brand.siteName}, I just placed order ${order.orderNumber}.`,
        ...order.items.map((i) => `• ${i.quantity} × ${i.productName}${Object.keys(i.options).length ? ` (${Object.values(i.options).join(', ')})` : ''}`),
        `Total: ${formatPrice(order.total, commerce)}`,
        `Name: ${order.customerName}`,
        `Delivery: ${order.address}, ${order.city}, ${order.country}`,
      ].join('\n')
    : `Hello ${brand.siteName}, I just placed order ${orderNumber}.`;

  return (
    <div ref={root} className="container-x py-16 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="ok-circle mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white">
          <Check size={34} strokeWidth={2} />
        </span>
        <h1 className="ok-item mt-8 text-4xl md:text-5xl">Thank you for your order</h1>
        <p className="ok-item mt-4 text-lg text-muted">
          Your order number is <span className="font-display text-ink">{orderNumber}</span>. {commerce.checkoutNote || 'Our team will be in touch shortly to confirm the details.'}
        </p>

        {order && (
          <div className="ok-item mt-10 bg-surface p-7 text-left">
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-[15px]">
                  <span>
                    {item.quantity} × {item.productName}
                    {Object.keys(item.options).length > 0 && <span className="block text-xs text-muted">{Object.values(item.options).join(' · ')}</span>}
                  </span>
                  <span>{formatPrice(item.unitPrice * item.quantity, commerce)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between text-muted">
                <dt>Delivery</dt>
                <dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping, commerce)}</dd>
              </div>
              <div className="flex justify-between font-display text-xl text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(order.total, commerce)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm text-muted">
              Delivering to {order.customerName}, {order.address}, {order.city}, {order.country}. A confirmation has been recorded for {order.email}.
            </p>
            {order.paymentMethod === 'bank_transfer' && commerce.bankDetails && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Bank transfer details</p>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{commerce.bankDetails}</pre>
              </div>
            )}
          </div>
        )}

        <div className="ok-item mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          {commerce.orderWhatsappEnabled && contact.whatsapp && (
            <Button href={whatsappLink(contact.whatsapp, waText)} external variant="whatsapp" size="lg" icon={<WhatsAppIcon size={18} />} iconPosition="left">
              Confirm on WhatsApp
            </Button>
          )}
          <Button href="/shop" variant="outline" size="lg" icon={<ArrowRight size={15} />}>
            Continue shopping
          </Button>
        </div>
        <p className="ok-item mt-8 text-sm text-muted">
          You can follow your order any time on the{' '}
          <Link href="/track" className="underline underline-offset-4">
            order tracking page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
