import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';
import { isAdmin, optionalAuth, requireAdmin } from '../lib/auth.ts';
import { uniqueSlug } from '../lib/slug.ts';
import { HttpError } from '../middleware/error.ts';

export const pagesRouter = express.Router();

const pageInput = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(160).optional(),
  content: z.string().max(200000).default(''),
  isPublished: z.boolean().default(true),
});

pagesRouter.get('/', optionalAuth, async (_req, res) => {
  const pages = await prisma.page.findMany({
    where: isAdmin(res) ? {} : { isPublished: true },
    orderBy: { title: 'asc' },
    select: { id: true, title: true, slug: true, isPublished: true, updatedAt: true },
  });
  res.json(pages);
});

pagesRouter.get('/:slugOrId', optionalAuth, async (req, res) => {
  const param = String(req.params.slugOrId);
  const where: Prisma.PageWhereUniqueInput = /^\d+$/.test(param) ? { id: Number(param) } : { slug: param };
  const page = await prisma.page.findUnique({ where });
  if (!page || (!page.isPublished && !isAdmin(res))) throw new HttpError(404, 'Page not found');
  res.json(page);
});

pagesRouter.post('/', requireAdmin, async (req, res) => {
  const input = pageInput.parse(req.body);
  const slug = await uniqueSlug('page', input.slug || input.title);
  const created = await prisma.page.create({ data: { ...input, slug } });
  res.status(201).json(created);
});

pagesRouter.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Page not found');
  const input = pageInput.partial().parse(req.body);
  const slug = input.slug !== undefined && input.slug !== existing.slug ? await uniqueSlug('page', input.slug || input.title || existing.title, id) : undefined;
  const updated = await prisma.page.update({ where: { id }, data: { ...input, ...(slug ? { slug } : {}) } });
  res.json(updated);
});

pagesRouter.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.page.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});
