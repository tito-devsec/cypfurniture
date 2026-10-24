import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { rateLimit, requireAdmin } from '../lib/auth.ts';

export const newsletterRouter = express.Router();

newsletterRouter.post('/', rateLimit({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: 'newsletter' }), async (req, res) => {
  const { email } = z.object({ email: z.email().trim().toLowerCase().max(160) }).parse(req.body);
  await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email }, update: {} });
  res.status(201).json({ ok: true });
});

newsletterRouter.get('/', requireAdmin, async (_req, res) => {
  const items = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });
  res.json({ items, total: items.length });
});

newsletterRouter.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.newsletterSubscriber.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});
