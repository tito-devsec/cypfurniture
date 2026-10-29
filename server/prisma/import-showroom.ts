/* eslint-disable no-console */
// Adds the CYP showroom pieces (showroom-products.ts, photos in web/public/showroom) to the catalogue.
// Safe to run more than once: a product whose SKU or slug already exists is skipped, so prices,
// texts and photos edited in the admin are never overwritten.
//
//   npm run db:import-showroom
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { SHOWROOM_PRODUCTS, type ShowroomProduct } from './showroom-products.ts';

const NEWLINE = String.fromCharCode(10);

/** Markdown description: intro paragraph, bullet list, closing note. */
function description(p: ShowroomProduct): string {
  return [p.intro, p.features.map((f) => `- ${f}`).join(NEWLINE), p.note].join(NEWLINE + NEWLINE);
}

export async function importShowroomProducts(prisma: PrismaClient): Promise<{ created: number; skipped: number }> {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));
  let created = 0;
  let skipped = 0;

  // Created last-to-first, so the list order is also the "newest first" order on the website
  for (let i = SHOWROOM_PRODUCTS.length - 1; i >= 0; i--) {
    const p = SHOWROOM_PRODUCTS[i];
    const sku = `CYP-SR-${String(i + 1).padStart(3, '0')}`;
    const existing = await prisma.product.findFirst({ where: { OR: [{ sku }, { slug: p.slug }] }, select: { id: true } });
    if (existing) {
      skipped++;
      continue;
    }
    if (!categoryId.has(p.category)) console.warn(`Category "${p.category}" not found: ${p.name} is imported without a category`);
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku,
        shortDescription: p.short,
        description: description(p),
        price: p.price,
        categoryId: categoryId.get(p.category) ?? null,
        colors: JSON.stringify([p.color]),
        tags: p.tags.join(', '),
        // 0 is shown as "Made to order" until the real stock is entered in the admin
        stock: 0,
        isFeatured: p.featured ?? false,
        // Featured pieces already lead the home page, so "New arrivals" shows the others
        isNew: !p.featured,
        images: {
          create: Array.from({ length: p.photos }, (_, j) => ({ url: `/showroom/${p.slug}-${j + 1}.jpg`, alt: p.name, sortOrder: j })),
        },
      },
    });
    created++;
  }
  return { created, skipped };
}

// Run directly: node prisma/import-showroom.ts
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prisma = new PrismaClient();
  importShowroomProducts(prisma)
    .then(({ created, skipped }) => console.log(`Showroom products: ${created} created, ${skipped} already in the catalogue`))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
