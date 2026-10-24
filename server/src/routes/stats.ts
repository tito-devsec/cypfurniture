import express from 'express';
import { prisma } from '../lib/prisma.ts';
import { requireAdmin } from '../lib/auth.ts';
import { parseJson } from '../lib/json.ts';
import { getSettings } from '../lib/settings.ts';

export const statsRouter = express.Router();

statsRouter.get('/', requireAdmin, async (_req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  const settings = await getSettings();
  const [
    products,
    activeProducts,
    categories,
    posts,
    publishedPosts,
    orders,
    pendingOrders,
    unreadMessages,
    subscribers,
    revenue,
    recentOrders,
    lowStock,
    topProducts,
    ordersByStatus,
    recentWindow,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.newsletterSubscriber.count(),
    prisma.order.aggregate({ where: { status: { not: 'cancelled' } }, _sum: { total: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { items: true } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: settings.commerce.lowStockThreshold } },
      orderBy: { stock: 'asc' },
      take: 6,
      select: { id: true, name: true, slug: true, stock: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, viewCount: true, price: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { not: 'cancelled' } }, select: { createdAt: true, total: true } }),
  ]);

  // Daily sales for the last 30 days (filled with zeros)
  const days: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), orders: 0, revenue: 0 });
  }
  const index = new Map(days.map((d, i) => [d.date, i]));
  for (const o of recentWindow) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) {
      days[i].orders += 1;
      days[i].revenue += o.total;
    }
  }

  res.json({
    counts: {
      products,
      activeProducts,
      categories,
      posts,
      publishedPosts,
      orders,
      pendingOrders,
      unreadMessages,
      subscribers,
      revenue: revenue._sum.total ?? 0,
    },
    ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s.status, s._count._all])),
    recentOrders: recentOrders.map((o) => ({
      ...o,
      items: o.items.map((i) => ({ ...i, options: parseJson<Record<string, string>>(i.options, {}) })),
    })),
    lowStock,
    topProducts,
    sales: days,
    currency: settings.commerce,
  });
});
