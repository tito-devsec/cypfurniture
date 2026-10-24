import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { containsInsensitive, prisma } from '../lib/prisma.ts';
import { isAdmin, optionalAuth, requireAdmin } from '../lib/auth.ts';
import { int, str, toList } from '../lib/json.ts';
import { uniqueSlug } from '../lib/slug.ts';
import { HttpError } from '../middleware/error.ts';

export const postsRouter = express.Router();

const postInput = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(200).optional(),
  excerpt: z.string().max(600).default(''),
  content: z.string().max(200000).default(''),
  coverImage: z.string().max(1000).default(''),
  author: z.string().max(80).default(''),
  tags: z.union([z.string(), z.array(z.string())]).default(''),
  readingTime: z.coerce.number().int().min(1).max(180).optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.coerce.date().nullable().optional(),
});

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

type PostRow = Prisma.BlogPostGetPayload<Record<string, never>>;

function serialize(p: PostRow) {
  return { ...p, tags: toList(p.tags) };
}

postsRouter.get('/', optionalAuth, async (req, res) => {
  const page = Math.max(1, int(req.query.page, 1));
  const limit = Math.min(50, Math.max(1, int(req.query.limit, 9)));
  const tag = str(req.query.tag);
  const q = str(req.query.q);
  const where: Prisma.BlogPostWhereInput = {};
  if (!(isAdmin(res) && str(req.query.includeDrafts) === '1')) where.isPublished = true;
  if (tag) where.tags = containsInsensitive(tag);
  if (q) where.OR = [{ title: containsInsensitive(q) }, { excerpt: containsInsensitive(q) }, { tags: containsInsensitive(q) }];
  const [total, items] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  res.json({ items: items.map(serialize), total, page, pages: Math.ceil(total / limit), limit });
});

postsRouter.get('/:slugOrId', optionalAuth, async (req, res) => {
  const param = String(req.params.slugOrId);
  const where: Prisma.BlogPostWhereUniqueInput = /^\d+$/.test(param) ? { id: Number(param) } : { slug: param };
  const post = await prisma.blogPost.findUnique({ where });
  if (!post || (!post.isPublished && !isAdmin(res))) throw new HttpError(404, 'Post not found');
  const related = await prisma.blogPost.findMany({
    where: { isPublished: true, id: { not: post.id } },
    orderBy: [{ publishedAt: 'desc' }],
    take: 3,
  });
  res.json({ post: serialize(post), related: related.map(serialize) });
});

postsRouter.post('/', requireAdmin, async (req, res) => {
  const input = postInput.parse(req.body);
  const slug = await uniqueSlug('blogPost', input.slug || input.title);
  const created = await prisma.blogPost.create({
    data: {
      ...input,
      slug,
      tags: toList(input.tags).join(', '),
      readingTime: input.readingTime ?? estimateReadingTime(input.content),
      publishedAt: input.isPublished ? (input.publishedAt ?? new Date()) : (input.publishedAt ?? null),
    },
  });
  res.status(201).json(serialize(created));
});

postsRouter.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Post not found');
  const input = postInput.partial().parse(req.body);
  const data: Prisma.BlogPostUpdateInput = { ...input, tags: input.tags !== undefined ? toList(input.tags).join(', ') : undefined };
  if (input.slug !== undefined && input.slug !== existing.slug) {
    data.slug = await uniqueSlug('blogPost', input.slug || input.title || existing.title, id);
  }
  if (input.content !== undefined && input.readingTime === undefined) data.readingTime = estimateReadingTime(input.content);
  if (input.isPublished && !existing.publishedAt && !input.publishedAt) data.publishedAt = new Date();
  const updated = await prisma.blogPost.update({ where: { id }, data });
  res.json(serialize(updated));
});

postsRouter.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.blogPost.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});
