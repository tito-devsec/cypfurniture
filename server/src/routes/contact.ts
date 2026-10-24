import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';
import { rateLimit, requireAdmin } from '../lib/auth.ts';
import { int, str } from '../lib/json.ts';
import { HttpError } from '../middleware/error.ts';

export const contactRouter = express.Router();

const contactInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().max(160),
  phone: z.string().trim().max(40).default(''),
  subject: z.string().trim().max(160).default(''),
  message: z.string().trim().min(5).max(4000),
  // honeypot field - bots fill it, humans never see it
  website: z.string().max(0).optional(),
});

contactRouter.post('/', rateLimit({ windowMs: 10 * 60 * 1000, max: 8, keyPrefix: 'contact' }), async (req, res) => {
  const input = contactInput.parse(req.body);
  const { website: _honeypot, ...data } = input;
  const created = await prisma.contactMessage.create({ data });
  res.status(201).json({ ok: true, id: created.id });
});

contactRouter.get('/', requireAdmin, async (req, res) => {
  const page = Math.max(1, int(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, int(req.query.limit, 20)));
  const where: Prisma.ContactMessageWhereInput = {};
  if (str(req.query.unread) === '1') where.isRead = false;
  const [total, items, unread] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit), limit, unread });
});

contactRouter.patch('/:id', requireAdmin, async (req, res) => {
  const { isRead } = z.object({ isRead: z.boolean() }).parse(req.body);
  const updated = await prisma.contactMessage.update({ where: { id: Number(req.params.id) }, data: { isRead } });
  res.json(updated);
});

contactRouter.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid id');
  await prisma.contactMessage.delete({ where: { id } });
  res.json({ ok: true });
});
