import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { containsInsensitive, prisma } from '../lib/prisma.ts';
import { isAdmin, optionalAuth, requireAdmin } from '../lib/auth.ts';
import { int, num, parseJson, str, toList, toJson } from '../lib/json.ts';
import { uniqueSlug } from '../lib/slug.ts';
import { HttpError } from '../middleware/error.ts';

export const productsRouter = express.Router();

const productInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function serializeProduct(p: ProductRow) {
  return {
    ...p,
    colors: parseJson<{ name: string; hex: string }[]>(p.colors, []),
    options: parseJson<{ name: string; values: string[] }[]>(p.options, []),
    specs: parseJson<{ label: string; value: string }[]>(p.specs, []),
    tags: toList(p.tags),
  };
}

const productInput = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(160).optional(),
  sku: z.string().trim().max(64).default(''),
  shortDescription: z.string().max(500).default(''),
  description: z.string().max(30000).default(''),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  images: z.array(z.object({ url: z.string().min(1).max(1000), alt: z.string().max(200).default('') })).max(20).default([]),
  materials: z.string().max(500).default(''),
  dimensions: z.string().max(500).default(''),
  colors: z.array(z.object({ name: z.string().max(60), hex: z.string().max(20) })).max(30).default([]),
  options: z.array(z.object({ name: z.string().max(60), values: z.array(z.string().max(60)).max(30) })).max(10).default([]),
  specs: z.array(z.object({ label: z.string().max(80), value: z.string().max(300) })).max(40).default([]),
  tags: z.union([z.string(), z.array(z.string())]).default(''),
  stock: z.coerce.number().int().min(0).default(10),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

function toData(input: z.infer<typeof productInput>) {
  const { images, slug, tags, colors, options, specs, compareAtPrice, categoryId, ...rest } = input;
  return {
    ...rest,
    compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
    categoryId: categoryId ?? null,
    tags: toList(tags).join(', '),
    colors: toJson(colors),
    options: toJson(options),
    specs: toJson(specs),
  };
}

/** Public catalogue listing with search, filters, sorting and pagination. */
productsRouter.get('/', optionalAuth, async (req, res) => {
  const q = str(req.query.q);
  const categorySlug = str(req.query.category);
  const categoryId = int(req.query.categoryId, 0);
  const sort = str(req.query.sort) || 'newest';
  const page = Math.max(1, int(req.query.page, 1));
  const limit = Math.min(60, Math.max(1, int(req.query.limit, 12)));
  const minPrice = num(req.query.minPrice);
  const maxPrice = num(req.query.maxPrice);
  const admin = isAdmin(res);

  const where: Prisma.ProductWhereInput = {};
  if (!(admin && str(req.query.includeInactive) === '1')) where.isActive = true;
  if (q) {
    where.OR = [
      { name: containsInsensitive(q) },
      { shortDescription: containsInsensitive(q) },
      { tags: containsInsensitive(q) },
      { sku: containsInsensitive(q) },
      { category: { name: containsInsensitive(q) } },
    ];
  }
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } },
    });
    if (!category) {
      res.json({ items: [], total: 0, page, pages: 0, limit });
      return;
    }
    where.categoryId = { in: [category.id, ...category.children.map((c) => c.id)] };
  } else if (categoryId) {
    where.categoryId = categoryId;
  }
  if (str(req.query.featured) === '1') where.isFeatured = true;
  if (str(req.query.new) === '1') where.isNew = true;
  if (str(req.query.bestseller) === '1') where.isBestSeller = true;
  if (str(req.query.sale) === '1') where.compareAtPrice = { gt: 0 };
  if (str(req.query.lowStock) === '1') where.stock = { lte: int(req.query.threshold, 3) };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === 'price-asc'
      ? [{ price: 'asc' }]
      : sort === 'price-desc'
        ? [{ price: 'desc' }]
        : sort === 'name'
          ? [{ name: 'asc' }]
          : sort === 'popular'
            ? [{ viewCount: 'desc' }, { createdAt: 'desc' }]
            : sort === 'oldest'
              ? [{ createdAt: 'asc' }]
              : [{ createdAt: 'desc' }];

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include: productInclude, orderBy, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ items: items.map(serializeProduct), total, page, pages: Math.ceil(total / limit), limit });
});

/** Public price range (for filters). */
productsRouter.get('/meta/price-range', async (_req, res) => {
  const agg = await prisma.product.aggregate({ where: { isActive: true }, _min: { price: true }, _max: { price: true } });
  res.json({ min: agg._min.price ?? 0, max: agg._max.price ?? 0 });
});

productsRouter.get('/:slugOrId', optionalAuth, async (req, res) => {
  const param = String(req.params.slugOrId);
  const where: Prisma.ProductWhereUniqueInput = /^\d+$/.test(param) ? { id: Number(param) } : { slug: param };
  const product = await prisma.product.findUnique({ where, include: productInclude });
  if (!product || (!product.isActive && !isAdmin(res))) throw new HttpError(404, 'Product not found');

  if (!isAdmin(res)) {
    prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
  }
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    include: productInclude,
    orderBy: [{ isBestSeller: 'desc' }, { viewCount: 'desc' }],
    take: 4,
  });
  res.json({ product: serializeProduct(product), related: related.map(serializeProduct) });
});

productsRouter.post('/', requireAdmin, async (req, res) => {
  const input = productInput.parse(req.body);
  const slug = await uniqueSlug('product', input.slug || input.name);
  const created = await prisma.product.create({
    data: {
      ...toData(input),
      slug,
      images: { create: input.images.map((img, i) => ({ url: img.url, alt: img.alt || input.name, sortOrder: i })) },
    },
    include: productInclude,
  });
  res.status(201).json(serializeProduct(created));
});

async function updateProduct(req: express.Request, res: express.Response) {
  const id = Number(req.params.id);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Product not found');
  const input = productInput.partial().parse(req.body);
  const data: Prisma.ProductUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = input.price;
  if (input.compareAtPrice !== undefined) data.compareAtPrice = input.compareAtPrice && input.compareAtPrice > 0 ? input.compareAtPrice : null;
  if (input.categoryId !== undefined) data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
  if (input.materials !== undefined) data.materials = input.materials;
  if (input.dimensions !== undefined) data.dimensions = input.dimensions;
  if (input.colors !== undefined) data.colors = toJson(input.colors);
  if (input.options !== undefined) data.options = toJson(input.options);
  if (input.specs !== undefined) data.specs = toJson(input.specs);
  if (input.tags !== undefined) data.tags = toList(input.tags).join(', ');
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.isNew !== undefined) data.isNew = input.isNew;
  if (input.isBestSeller !== undefined) data.isBestSeller = input.isBestSeller;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.slug !== undefined && input.slug !== existing.slug) {
    data.slug = await uniqueSlug('product', input.slug || input.name || existing.name, id);
  }
  if (input.images !== undefined) {
    data.images = {
      deleteMany: {},
      create: input.images.map((img, i) => ({ url: img.url, alt: img.alt || input.name || existing.name, sortOrder: i })),
    };
  }
  const updated = await prisma.product.update({ where: { id }, data, include: productInclude });
  res.json(serializeProduct(updated));
}

productsRouter.put('/:id', requireAdmin, updateProduct);
productsRouter.patch('/:id', requireAdmin, updateProduct);

productsRouter.post('/:id/duplicate', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const source = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!source) throw new HttpError(404, 'Product not found');
  const { id: _id, createdAt: _c, updatedAt: _u, images, viewCount: _v, ...rest } = source;
  const slug = await uniqueSlug('product', `${source.name} copy`);
  const created = await prisma.product.create({
    data: {
      ...rest,
      name: `${source.name} (copy)`,
      slug,
      isActive: false,
      images: { create: images.map((img) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder })) },
    },
    include: productInclude,
  });
  res.status(201).json(serializeProduct(created));
});

productsRouter.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  res.json({ ok: true });
});
