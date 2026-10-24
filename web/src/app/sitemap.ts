import type { MetadataRoute } from 'next';
import { getCategories, getPosts, getProducts } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts] = await Promise.all([getProducts({ limit: 60, page: 1 }), getCategories(), getPosts({ limit: 50 })]);
  const staticPages = ['', '/shop', '/blog', '/about', '/contact', '/track'].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date() }));
  return [
    ...staticPages,
    ...categories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}`, lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date() })),
    ...products.items.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: new Date(p.updatedAt) })),
    ...posts.items.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.updatedAt) })),
  ];
}
