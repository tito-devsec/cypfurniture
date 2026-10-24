import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { containsInsensitive, prisma } from '../lib/prisma.ts';
import { rateLimit, requireAdmin } from '../lib/auth.ts';
import { int, parseJson, str } from '../lib/json.ts';
import { getSettings } from '../lib/settings.ts';
import { HttpError } from '../middleware/error.ts';

export const ordersRouter = express.Router();

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const orderInput = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.email().trim().toLowerCase().max(160),
    phone: z.string().trim().min(5).max(40),
    address: z.string().trim().min(3).max(300),
    city: z.string().trim().min(1).max(80),
    country: z.string().trim().min(1).max(80),
    postalCode: z.string().trim().max(20).default(''),
  }),
  notes: z.string().max(1000).default(''),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'whatsapp']).default('cod'),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
        options: z.record(z.string(), z.string()).default({}),
      }),
    )
    .min(1)
    .max(50),
});

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

function serialize(order: OrderRow) {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item, options: parseJson<Record<string, string>>(item.options, {}) })),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Public checkout: creates an order from product ids (prices are always taken from the database). */
ordersRouter.post('/', rateLimit({ windowMs: 10 * 60 * 1000, max: 15, keyPrefix: 'orders' }), async (req, res) => {
  const input = orderInput.parse(req.body);
  const settings = await getSettings();

  if (input.paymentMethod === 'cod' && !settings.commerce.enableCod) throw new HttpError(400, 'Cash on delivery is not available');
  if (input.paymentMethod === 'bank_transfer' && !settings.commerce.enableBankTransfer) throw new HttpError(400, 'Bank transfer is not available');

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });
  if (products.length !== ids.length) throw new HttpError(400, 'One or more products are no longer available');
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = input.items.map((item) => {
    const product = byId.get(item.productId)!;
    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.images[0]?.url ?? '',
      unitPrice: product.price,
      quantity: item.quantity,
      options: JSON.stringify(item.options),
    };
  });
  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const { shippingFlatRate, freeShippingThreshold, currencyCode } = settings.commerce;
  const shipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFlatRate;
  const total = round2(subtotal + shipping);

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const seq = (last?.id ?? 0) + 1;
    const orderNumber = `CYP-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerName: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        address: input.customer.address,
        city: input.customer.city,
        country: input.customer.country,
        postalCode: input.customer.postalCode,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        subtotal,
        shipping,
        total,
        currency: currencyCode,
        items: { create: lines },
      },
      include: { items: true },
    });
    for (const line of lines) {
      // Decrement stock when available; items with insufficient stock are treated as made-to-order.
      await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
    }
    return created;
  });

  res.status(201).json({ order: serialize(order) });
});

/** Public order tracking: order number + the email used at checkout. */
ordersRouter.get('/track/:orderNumber', rateLimit({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'track' }), async (req, res) => {
  const email = str(req.query.email).toLowerCase();
  const order = await prisma.order.findUnique({ where: { orderNumber: String(req.params.orderNumber).trim().toUpperCase() }, include: { items: true } });
  if (!order || order.email.toLowerCase() !== email) throw new HttpError(404, 'We could not find an order with that number and email');
  res.json({ order: serialize(order) });
});

// ------------------------------------------------------------------ admin

ordersRouter.get('/', requireAdmin, async (req, res) => {
  const page = Math.max(1, int(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, int(req.query.limit, 20)));
  const status = str(req.query.status);
  const q = str(req.query.q);
  const where: Prisma.OrderWhereInput = {};
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) where.status = status;
  if (q) where.OR = [{ orderNumber: containsInsensitive(q) }, { customerName: containsInsensitive(q) }, { email: containsInsensitive(q) }, { phone: containsInsensitive(q) }];
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ items: items.map(serialize), total, page, pages: Math.ceil(total / limit), limit });
});

ordersRouter.get('/:id', requireAdmin, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: { items: true } });
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ order: serialize(order) });
});

ordersRouter.patch('/:id', requireAdmin, async (req, res) => {
  const schema = z.object({ status: z.enum(ORDER_STATUSES).optional(), notes: z.string().max(2000).optional() });
  const data = schema.parse(req.body);
  const order = await prisma.order.update({ where: { id: Number(req.params.id) }, data, include: { items: true } });
  res.json({ order: serialize(order) });
});

ordersRouter.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.order.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});
