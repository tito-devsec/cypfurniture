import { prisma } from './prisma.ts';

export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'item';
}

type SlugModel = 'product' | 'category' | 'blogPost' | 'page';

/** Produce a slug that is unique within the given model (appends -2, -3 ... when taken). */
export async function uniqueSlug(model: SlugModel, base: string, excludeId?: number): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let counter = 2;
  for (;;) {
    let existing: { id: number } | null = null;
    const where = { where: { slug: candidate }, select: { id: true } } as const;
    if (model === 'product') existing = await prisma.product.findUnique(where);
    else if (model === 'category') existing = await prisma.category.findUnique(where);
    else if (model === 'blogPost') existing = await prisma.blogPost.findUnique(where);
    else existing = await prisma.page.findUnique(where);
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
  }
}
