'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';
import { formatDateTime, formatPrice, resolveImage, statusLabel, telLink, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useSiteSettings } from '@/components/admin/use-settings';
import { useToast } from '@/components/admin/toast';
import { AdminButton, Card, ConfirmDialog, Field, LoadingBlock, PageHeader, Select, StatusBadge, Textarea } from '@/components/admin/ui';

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { commerce, settings } = useSiteSettings();
  const { data, loading, error, setData } = useAdminQuery<{ order: Order }>(`/api/orders/${id}`);
  const [notes, setNotes] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (loading && !data) return <LoadingBlock />;
  if (error || !data) return <p className="text-sm text-danger">{error || 'Order not found'}</p>;
  const order = data.order;

  const update = async (patch: { status?: OrderStatus; notes?: string }) => {
    try {
      const res = await adminApi.patch<{ order: Order }>(`/api/orders/${order.id}`, patch);
      setData(res);
      toast.success('Order updated');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async () => {
    try {
      await adminApi.delete(`/api/orders/${order.id}`);
      toast.success('Order deleted');
      router.push('/orders');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const waText = `Hello ${order.customerName}, this is ${settings.brand.siteName} about your order ${order.orderNumber}.`;

  return (
    <div>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · ${statusLabel(order.paymentMethod)}`}
        back={{ href: '/orders', label: 'Orders' }}
        actions={
          <>
            <StatusBadge status={order.status} />
            <Select value={order.status} onChange={(e) => update({ status: e.target.value as OrderStatus })} className="w-44">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
            <AdminButton variant="danger" size="md" onClick={() => setDeleting(true)} icon={<Trash2 size={14} />}>
              Delete
            </AdminButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImage(item.imageUrl)} alt="" className="h-14 w-11 bg-surface object-cover" />
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link href={`/products/${item.productId}`} className="font-medium hover:text-accent">
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="font-medium">{item.productName}</p>
                    )}
                    {Object.keys(item.options).length > 0 && (
                      <p className="text-xs text-muted">
                        {Object.entries(item.options)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    {item.quantity} × {formatPrice(item.unitPrice, commerce)}
                  </p>
                  <p className="w-24 text-right font-medium">{formatPrice(item.unitPrice * item.quantity, commerce)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ml-auto max-w-xs space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal, commerce)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Delivery</dt>
                <dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping, commerce)}</dd>
              </div>
              <div className="flex justify-between font-display text-lg text-ink">
                <dt>Total</dt>
                <dd>{formatPrice(order.total, commerce)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Internal notes" description="Customer notes from checkout plus anything your team adds.">
            <Field label="Notes">
              <Textarea value={notes ?? order.notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <AdminButton className="mt-3" size="sm" disabled={notes === null || notes === order.notes} onClick={() => notes !== null && update({ notes })}>
              Save notes
            </AdminButton>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium">{order.customerName}</p>
            <p className="mt-1 text-sm text-muted">{order.email}</p>
            <p className="text-sm text-muted">{order.phone}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminButton variant="secondary" size="sm" href={telLink(order.phone)} icon={<Phone size={13} />}>
                Call
              </AdminButton>
              <a href={whatsappLink(order.phone, waText)} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-2 rounded-sm bg-whatsapp px-3 text-xs font-medium text-white hover:opacity-90">
                <WhatsAppIcon size={13} /> WhatsApp
              </a>
              <AdminButton variant="secondary" size="sm" href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order ${order.orderNumber}`)}`} icon={<Mail size={13} />}>
                Email
              </AdminButton>
            </div>
          </Card>
          <Card title="Delivery address">
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              {order.address}
              <br />
              {order.city}
              {order.postalCode ? `, ${order.postalCode}` : ''}
              <br />
              {order.country}
            </address>
          </Card>
          <Card title="Payment">
            <p className="text-sm">{statusLabel(order.paymentMethod)}</p>
            <p className="mt-1 text-xs text-muted">Currency: {order.currency}</p>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} onConfirm={remove} title={`Delete order ${order.orderNumber}?`} />
    </div>
  );
}
