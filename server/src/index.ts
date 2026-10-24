import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRouter } from './routes/auth.ts';
import { settingsRouter } from './routes/settings.ts';
import { categoriesRouter } from './routes/categories.ts';
import { productsRouter } from './routes/products.ts';
import { postsRouter } from './routes/posts.ts';
import { pagesRouter } from './routes/pages.ts';
import { ordersRouter } from './routes/orders.ts';
import { contactRouter } from './routes/contact.ts';
import { newsletterRouter } from './routes/newsletter.ts';
import { uploadsRouter, UPLOAD_DIR } from './routes/uploads.ts';
import { statsRouter } from './routes/stats.ts';
import { errorHandler, notFound } from './middleware/error.ts';
import { prisma } from './lib/prisma.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server requests (no Origin header) and configured origins.
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Uploaded media (product images, logos, blog covers ...)
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

app.get('/', (_req, res) => {
  res.json({ name: 'CYP Furniture API', version: '1.0.0', docs: '/api/health' });
});
app.get('/api/health', async (_req, res) => {
  await prisma.$queryRawUnsafe('SELECT 1');
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/stats', statsRouter);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n  CYP Furniture API running at http://localhost:${PORT}`);
  console.log(`  Uploads directory: ${UPLOAD_DIR}`);
  console.log(`  Allowed origins:   ${allowedOrigins.join(', ')}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      prisma.$disconnect().finally(() => process.exit(0));
    });
  });
}

export { app, __dirname };
