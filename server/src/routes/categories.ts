import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.ts';
import { isAdmin, optionalAuth, requireAdmin } from '../lib/auth.ts';
import { str } from '../lib/json.ts';
import { uniqueSlug } from '../lib/slug.ts';
import { HttpError } from '../middleware/error.ts';

export const categoriesRouter = express.Router();

const categoryInput = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().max(1000).default(''),
  imageUrl: z.string().max(1000).default(''),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true),
  parentId: z.coerce.number().int().positive().nullable().optional(),
});

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  showInMenu: boolean;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { products: number };
};

function serialize(c: CategoryRow) {
  const { _count, ...rest } = c;
  return { ...rest, productCount: _count.products };
}

export type CategoryNode = ReturnType<typeof serialize> & { children: CategoryNode[] };

export function buildTree(rows: CategoryRow[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>();
  for (const row of rows) nodes.set(row.id, { ...serialize(row), children: [] });
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sortNodes = (list: CategoryNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    for (const n of list) {
      sortNodes(n.children);
      n.productCount += n.children.reduce((sum, c) => sum + c.productCount, 0);
    }
  };
  sortNodes(roots);
  return roots;
}

async function listCategories(includeInactive: boolean) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
}

/** Public list. `?tree=1` nests children under parents. Admin + `?includeInactive=1` returns hidden ones too. */
categoriesRouter.get('/', optionalAuth, async (req, res) => {
  const includeInactive = isAdmin(res) && str(req.query.includeInactive) === '1';
  const rows = await listCategories(includeInactive);
  if (str(req.query.tree) === '1') {
    res.json(buildTree(rows));
    return;
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  res.json(
    rows.map((r) => {
      const parent = r.parentId ? byId.get(r.parentId) : undefined;
      return { ...serialize(r), parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null };
    }),
  );
});

categoriesRouter.put('/reorder', requireAdmin, async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.number().int()).min(1) }).parse(req.body);
  await prisma.$transaction(ids.map((id, index) => prisma.category.update({ where: { id }, data: { sortOrder: index } })));
  res.json({ ok: true });
});

categoriesRouter.get('/:slugOrId', optionalAuth, async (req, res) => {
  const param = String(req.params.slugOrId);
  const where: Prisma.CategoryWhereUniqueInput = /^\d+$/.test(param) ? { id: Number(param) } : { slug: param };
  const category = await prisma.category.findUnique({
    where,
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        where: isAdmin(res) ? {} : { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      },
    },
  });
  if (!category || (!category.isActive && !isAdmin(res))) throw new HttpError(404, 'Category not found');
  const { children, parent, ...rest } = category;
  res.json({ ...serialize(rest), parent, children: children.map(serialize) });
});

categoriesRouter.post('/', requireAdmin, async (req, res) => {
  const input = categoryInput.parse(req.body);
  const slug = await uniqueSlug('category', input.slug || input.name);
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new HttpError(400, 'Parent category does not exist');
    if (parent.parentId) throw new HttpError(400, 'Only two levels of categories are supported');
  }
  const created = await prisma.category.create({
    data: { ...input, slug, parentId: input.parentId ?? null },
    include: { _count: { select: { products: true } } },
  });
  res.status(201).json(serialize(created));
});

categoriesRouter.put('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Category not found');
  const input = categoryInput.partial().parse(req.body);
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === id) throw new HttpError(400, 'A category cannot be its own parent');
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new HttpError(400, 'Parent category does not exist');
    if (parent.parentId) throw new HttpError(400, 'Only two levels of categories are supported');
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) throw new HttpError(400, 'This category has sub-categories and cannot be nested');
  }
  const slug = input.slug !== undefined && input.slug !== existing.slug ? await uniqueSlug('category', input.slug || input.name || existing.name, id) : undefined;
  const updated = await prisma.category.update({
    where: { id },
    data: { ...input, ...(slug ? { slug } : {}) },
    include: { _count: { select: { products: true } } },
  });
  res.json(serialize(updated));
});

categoriesRouter.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.category.delete({ where: { id } });
  res.json({ ok: true });
});
