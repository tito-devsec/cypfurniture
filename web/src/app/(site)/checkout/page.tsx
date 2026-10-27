'use client';

import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { selectSubtotal, useCart } from '@/lib/cart-store';
import { useHydrated } from '@/lib/use-hydrated';
import type { Order } from '@/lib/types';
import { cn, resolveImage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Field, Input, Textarea } from '@/components/ui/form';
import { useMoney, useSite } from '@/components/site/site-provider';

type PaymentMethod = 'cod' | 'bank_transfer' | 'whatsapp';

export default function CheckoutPage() {
  const router = useRouter();
  const { settings } = useSite();
  const { commerce, contact } = settings;
  const { items, clear } = useCart();
  const subtotal = useCart(selectSubtotal);
  const { format, currency, base, isBase } = useMoney();
  const mounted = useHydrated();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: contact.country || '', city: '', address: '', postalCode: '', notes: '' });

  const methods: { id: PaymentMethod; label: string; text: string }[] = [];
  if (commerce.enableCod) methods.push({ id: 'cod', label: 'Cash on delivery', text: 'Pay when your furniture arrives.' });
  if (commerce.enableBankTransfer) methods.push({ id: 'bank_transfer', label: 'Bank transfer', text: 'We send you our bank details after the order.' });
  if (commerce.orderWhatsappEnabled && contact.whatsapp) methods.push({ id: 'whatsapp', label: 'Confirm via WhatsApp', text: 'Finalise payment with our team on WhatsApp.' });
  const [method, setMethod] = useState<PaymentMethod>(methods[0]?.id ?? 'cod');

  const shipping = commerce.freeShippingThreshold > 0 && subtotal >= commerce.freeShippingThreshold ? 0 : commerce.shippingFlatRate;
  const total = subtotal + shipping;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const { order } = await apiFetch<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, country: form.country, postalCode: form.postalCode },
          notes: form.notes,
          paymentMethod: method,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, options: i.options })),
        }),
      });
      try {
        window.sessionStorage.setItem('cyp_last_order', JSON.stringify(order));
      } catch {
        /* ignore */
      }
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) {
          const map: Record<string, string> = {};
          for (const d of err.details) map[d.path.replace('customer.', '')] = d.message;
          setFieldErrors(map);
        }
      } else setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (!mounted) return <div className="container-x py-20" />;

  if (items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted">Add a few pieces before checking out.</p>
        <Button href="/shop" className="mt-8">
          Browse products
        </Button>
      </div>
    );
  }

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Checkout</h1>

      <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-12" noValidate>
        <div className="space-y-12 lg:col-span-7">
          <section>
            <h2 className="mb-6 font-display text-2xl">Contact details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required error={fieldErrors.name}>
                <Input value={form.name} onChange={set('name')} autoComplete="name" required />
              </Field>
              <Field label="Phone" required error={fieldErrors.phone} hint="Include your country code">
                <Input value={form.phone} onChange={set('phone')} type="tel" autoComplete="tel" required />
              </Field>
              <Field label="Email" required error={fieldErrors.email} className="sm:col-span-2">
                <Input value={form.email} onChange={set('email')} type="email" autoComplete="email" required />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-6 font-display text-2xl">Delivery address</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Country" required error={fieldErrors.country}>
                <Input value={form.country} onChange={set('country')} autoComplete="country-name" required />
              </Field>
              <Field label="City" required error={fieldErrors.city}>
                <Input value={form.city} onChange={set('city')} autoComplete="address-level2" required />
              </Field>
              <Field label="Street address" required error={fieldErrors.address} className="sm:col-span-2">
                <Input value={form.address} onChange={set('address')} autoComplete="street-address" placeholder="Building, street, apartment / villa number" required />
              </Field>
              <Field label="Postal code" error={fieldErrors.postalCode}>
                <Input value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" />
              </Field>
              <Field label="Order notes" className="sm:col-span-2" hint="Preferred delivery time, access instructions, custom requests ...">
                <Textarea value={form.notes} onChange={set('notes')} className="min-h-[100px]" />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-6 font-display text-2xl">Payment</h2>
            <div className="space-y-3">
              {methods.map((m) => (
                <label key={m.id} className={cn('flex cursor-pointer items-start gap-4 border p-5 transition-colors', method === m.id ? 'border-ink bg-surface' : 'border-line hover:border-line-strong')}>
                  <input type="radio" name="payment" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-accent" />
                  <span>
                    <span className="block font-display text-lg">{m.label}</span>
                    <span className="block text-sm text-muted">{m.text}</span>
                  </span>
                </label>
              ))}
            </div>
            {commerce.checkoutNote && <p className="mt-5 text-sm leading-relaxed text-muted">{commerce.checkoutNote}</p>}
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-surface p-7 lg:sticky lg:top-40">
            <h2 className="font-display text-2xl">Your order</h2>
            <ul className="mt-6 divide-y divide-line">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-4 py-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-white">
                    <Image src={resolveImage(item.image)} alt={item.name} fill sizes="56px" className="object-cover" />
                    <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-ink px-1 text-[10px] text-white">{item.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px]">{item.name}</p>
                    {Object.keys(item.options).length > 0 && <p className="truncate text-xs text-muted">{Object.values(item.options).join(' · ')}</p>}
                  </div>
                  <span className="text-sm">{format(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-3 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{format(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{shipping === 0 ? <span className="text-accent">Free</span> : format(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-4 font-display text-xl">
                <dt>Total</dt>
                <dd>{format(total)}</dd>
              </div>
            </dl>
            {!isBase && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Shown in {currency} for reference. Your order is placed and paid in {base.code}.
              </p>
            )}
            {error && <p className="mt-5 border border-sale/40 bg-sale/5 px-4 py-3 text-sm text-sale">{error}</p>}
            <Button type="submit" full size="lg" className="mt-7" loading={loading} icon={<ArrowRight size={15} />}>
              Place order
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
              <Lock size={12} /> Your details are only used to process this order.
            </p>
            <p className="mt-3 text-center text-xs text-muted">
              By placing an order you agree to our{' '}
              <Link href="/p/terms" className="underline underline-offset-2">
                terms of service
              </Link>
              .
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
