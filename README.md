# CYP Furniture & Decor®

*Beyond Furniture. Designed for Living.*

A complete website for **CYP FURNITURE & DECOR®** (luxury furniture, bespoke design and interior solutions, handcrafted in Tanzania) with a public storefront, online ordering and quotation requests, and a full admin panel.

| Part | Stack |
| --- | --- |
| `web/` – customer website | Next.js 16 (App Router, React 19), Tailwind CSS v4, GSAP 3 (ScrollTrigger, SplitText, ScrollTo), Zustand |
| `admin/` – admin panel (separate app, own port) | Next.js 16, Tailwind CSS v4, GSAP; talks to the API with a JWT |
| `server/` – API | Node.js 22+, Express 5, Prisma 6, SQLite by default (PostgreSQL ready), JWT auth, Multer uploads, Zod validation |

Prices are stored in **Tanzanian shillings (TZS)**; visitors can switch the displayed currency (USD, EUR, GBP, AED, SAR, KES, UGX, ZAR, CNY, INR, JPY, CAD, AUD, CHF …) in the top bar. Rates refresh daily from a free exchange-rate service and can be edited in the admin.

Design: minimal, flat, Marcellus + Jost typography, inspired by homeyfad.com (mega menu, hero slider, trust badges, shop-by-room tiles, product grid, blog). Brand colours: CYP red `#EB001B` and orange `#F79E1B` as controlled accents, warm cream `#F6EFEA`, white and charcoal.

> **Demo content.** The seeded products, prices, blog posts and policy pages are placeholders that show the design. Replace them with real CYP products, photos, prices and texts in the admin before launch. Products without a fixed price can be published with price `0`, which shows "Request a quote" instead of a price.

---

## 1. Quick start (development)

Requirements: **Node.js 22.12 or newer** (24 recommended) and npm.

```bash
npm install          # installs all workspaces (server + web + admin)
npm run setup        # generates the Prisma client, creates the SQLite database and seeds demo content
npm run dev          # starts the API (4000), the website (3000) and the admin panel (3002)
```

Then open:

- Customer website: <http://localhost:3000> (if port 3000 is busy, Next.js picks 3001 automatically – both are allowed by the API)
- Admin panel: <http://localhost:3002> – a separate application; it is **not** reachable from the customer website and has no link there

The admin login is the initial account created by the seed. Its email and password are the `ADMIN_EMAIL` / `ADMIN_PASSWORD` values in [`server/.env`](server/.env) (copy of [`server/.env.example`](server/.env.example)). **Change the password after the first login** (Admin → My account) and change `JWT_SECRET` before going live.

The seed only adds data that does not exist yet, so it is safe to run again. To wipe everything and start from the demo content:

```bash
npm run db:reset
```

### Useful scripts (run from the repository root)

| Script | What it does |
| --- | --- |
| `npm run dev` | API + website in development mode (hot reload) |
| `npm run dev:server` / `npm run dev:web` / `npm run dev:admin` | only one of the three |
| `npm run build` | production builds of the website and the admin panel |
| `npm run start` | run API + website + admin in production mode (after `npm run build`) |
| `npm run setup` | `prisma generate` + `prisma db push` + seed |
| `npm run db:seed` | seed demo data (idempotent) |
| `npm run db:import-showroom` | add the real CYP showroom products (photos in `web/public/showroom`); skips products that already exist |
| `npm run db:reset` | drop & recreate the database, then seed |
| `npm run db:studio` | open Prisma Studio to inspect the database |
| `npm run typecheck` | TypeScript checks for all workspaces |
| `npm run lint` | ESLint for the website and the admin |
| `npm run brand:assets` | regenerate favicon, icons and the share image from `web/public/logo.png` |

---

## 2. What the website includes

**Storefront**

- Home: hero slider (GSAP cross-fade + Ken Burns + text reveal), trust badges, shop-by-room tiles, featured products, showcase banner with parallax, ticker, new arrivals carousel, best sellers, testimonials, blog preview, call-to-action banner, newsletter.
- Shop with category tree (two levels), search, price range, sale / new / best-seller filters, sorting and pagination; category landing pages with sub-category chips.
- Product page: gallery with lightbox, colour swatches, options (size …), quantity, add to cart, **Order via WhatsApp** (pre-filled message), stock status, specifications, delivery & returns, related products.
- Cart drawer + cart page, checkout (cash on delivery, bank transfer or confirm via WhatsApp), order confirmation page, **order tracking** (`/track`).
- Blog (list + article pages, tags, Markdown content), About page (stats counter, story, values), Contact page (cards, form, map, social links), free-form pages (`/p/faq`, `/p/terms` …), 404 page, sitemap and robots.
- Top bar with social icons (TikTok, Instagram, Facebook, WhatsApp …), announcement and the **currency selector** (remembered per visitor); floating WhatsApp button, SEO metadata, responsive layout with a GSAP-animated mobile drawer.

**Admin panel** (separate app on port 3002)

- Dashboard: revenue, orders, products, unread messages, subscribers, 30-day sales chart, recent orders, low-stock and most-viewed products.
- Products: list with search/filter/sort, create/edit with image upload (drag & drop, media library or URL), reordering of images, colours, options, specifications, pricing & compare-at price, stock, featured/new/best-seller flags, visibility, duplicate, delete.
- Categories: two-level tree, images, ordering (drives the mega menu), show in menu / hide.
- Orders: list with status filter and search, detail with status workflow (pending → confirmed → processing → shipped → delivered / cancelled), notes, call / WhatsApp / email the customer.
- Messages (contact form) and newsletter subscribers (CSV export).
- Blog posts and pages with a Markdown editor and preview.
- Media library.
- **Settings** – everything customers see:
  - Brand & theme: site name, tagline, logo, dark-logo variant, favicon, wordmark, accent / surface / sale colours, **heading font, text font and base text size** (with live preview).
  - Contact & social: email, phones, WhatsApp number & pre-filled message, address, opening hours, showroom map (Google Maps listing name and coordinates, optional custom embed), TikTok / Instagram / Facebook / YouTube / Pinterest / X / LinkedIn.
  - Announcement bar and hero slides.
  - Home page: trust badges, section titles, showcase & bottom banners, testimonials, newsletter box.
  - About page content, footer columns & links, navigation links.
  - Orders & currency: shop currency (TZS by default), the **currency converter list** with manual or daily automatic rates, delivery fee and free-delivery threshold, payment methods, bank details, checkout note, stock display, "Request a quote" label.
  - SEO: default title, description, keywords, sharing image, Google Analytics ID, Google Search Console verification.
- My account: profile and password.

**Logo and brand assets**

The original logo lives at `web/public/logo.png` and is never modified. Derived files are generated from it with:

```bash
npm run brand:assets
```

This writes `web/public/logo-mark.png` (cropped lettermark used in the header, footer and admin), `web/src/app/icon.png` (favicon), `web/src/app/apple-icon.png` and `web/public/og-image.jpg` (image shown when the site is shared on WhatsApp, Facebook or X). The admin is a separate app, so the same command copies the lettermark and icons into `admin/public` and `admin/src/app`. To use a different logo, replace `web/public/logo.png` and run the command again, or upload a logo in Admin → Settings → Brand & theme.

The site also emits structured data (schema.org `LocalBusiness` / `FurnitureStore` with the showroom address and map coordinates on every page, `Product` on product pages), canonical URLs, a sitemap and robots rules.

---

## 3. Project structure

```
cypfurniture/
├── package.json             # npm workspaces + root scripts
├── server/                  # Node.js API
│   ├── prisma/schema.prisma # database schema (SQLite by default)
│   ├── prisma/seed.ts       # admin account + demo content
│   ├── src/index.ts         # Express app
│   ├── src/routes/          # auth, settings, categories, products, posts, pages, orders, contact, newsletter, uploads, stats
│   ├── src/lib/settings.ts  # default site settings + validation (the "customise website" model)
│   └── uploads/             # uploaded images (served at /uploads/...)
├── web/                     # customer website (Next.js)
│   ├── public/logo.png      # original logo (brand assets are derived from it)
│   ├── src/app/(site)/      # storefront routes
│   ├── src/components/site  # top bar, header (mega menu), hero, product cards, cart drawer, footer ...
│   ├── src/components/ui    # buttons, reveal/split-text animations, forms ...
│   └── src/lib/             # API client, types, cart store, GSAP setup, fonts
└── admin/                   # admin panel (Next.js, port 3002)
    ├── src/app/             # dashboard, products, categories, orders, messages, blog, pages, media, settings
    ├── src/components/admin # shell, forms, uploader, settings editor ...
    └── src/lib/             # API client, admin session, types
```

The API runs the TypeScript sources directly with Node's built-in type stripping (no build step). Keep the `.ts` extension in server imports.

---

## 4. Configuration

### `server/.env`

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:3001` | allowed website origins (comma separated) – set to your domain in production |
| `DATABASE_URL` | `file:./dev.db` | SQLite file or PostgreSQL connection string |
| `JWT_SECRET` | – | **change in production** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | – | initial admin account created by the seed |
| `UPLOAD_DIR` | `server/uploads` | where uploaded images are stored |

### `web/.env.local`

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API url used by the browser |
| `API_URL` | `http://localhost:4000` | API url used by the Next.js server |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | public website url (sitemap, Open Graph) |

### `admin/.env.local`

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API url used by the admin's browser code |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | customer website url for the "View site" / "View product" links |

### Switching to PostgreSQL

1. In [`server/prisma/schema.prisma`](server/prisma/schema.prisma) change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/cypfurniture?schema=public"` in `server/.env`.
3. Run `npm run setup` (or `npm run db:migrate -w server` to create migrations).

Search, filters and all features work the same on both databases.

---

## 5. Going to production

1. Set real values in `server/.env` (`JWT_SECRET`, `CORS_ORIGIN` with both the website and the admin domains, admin credentials, PostgreSQL if desired), in `web/.env.local` and in `admin/.env.local`.
2. `npm install && npm run setup && npm run build`
3. `npm run start` – or run `node src/index.ts` in `server/`, `next start` in `web/` and `next start -p 3002` in `admin/` under a process manager (PM2, systemd) or Docker, behind a reverse proxy (nginx/Caddy) with HTTPS.
4. Publish the admin on its own hostname (for example `admin.cypfurniture.com`), never under the public site. It already requires a login; for extra protection restrict it at the proxy to your office IP addresses or add HTTP basic auth.
5. Back up the database file (or Postgres) and the `server/uploads` folder.

Uploaded images are optimised by Next.js; images from other hosts (demo content, CDN links entered in the admin) are loaded directly by the browser.

---

## 6. API overview

All responses are JSON. Admin endpoints require `Authorization: Bearer <token>` from `POST /api/auth/login`.

| Area | Public | Admin |
| --- | --- | --- |
| Settings | `GET /api/settings` | `PUT /api/settings` (deep-merge patch), `POST /api/settings/reset` |
| Categories | `GET /api/categories[?tree=1]`, `GET /api/categories/:slug` | `POST`, `PUT /:id`, `DELETE /:id`, `PUT /reorder` |
| Products | `GET /api/products?q=&category=&sort=&page=&limit=&featured=1&new=1&bestseller=1&sale=1&minPrice=&maxPrice=`, `GET /api/products/:slug` | `POST`, `PUT /:id`, `DELETE /:id`, `POST /:id/duplicate` |
| Blog | `GET /api/posts`, `GET /api/posts/:slug` | `POST`, `PUT /:id`, `DELETE /:id` |
| Pages | `GET /api/pages`, `GET /api/pages/:slug` | `POST`, `PUT /:id`, `DELETE /:id` |
| Orders | `POST /api/orders`, `GET /api/orders/track/:orderNumber?email=` | `GET /api/orders`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Contact | `POST /api/contact` | `GET /api/contact`, `PATCH /:id`, `DELETE /:id` |
| Newsletter | `POST /api/newsletter` | `GET`, `DELETE /:id` |
| Uploads | – | `POST /api/uploads` (multipart `files`), `GET /api/uploads`, `DELETE /api/uploads?url=` |
| Stats | – | `GET /api/stats` |
| Currencies | `GET /api/currencies` (base currency + rates, auto-refreshed daily) | `POST /api/currencies/refresh` |
| Auth | `POST /api/auth/login` | `GET /api/auth/me`, `PUT /api/auth/profile`, `POST /api/auth/change-password` |

Prices are always taken from the database when an order is created; stock is decremented automatically.

---

## 7. Troubleshooting

- **"Port 3000 is in use"** – Next.js switches to 3001 automatically; both ports are allowed by the default `CORS_ORIGIN`. For any other port add it to `CORS_ORIGIN` in `server/.env`.
- **Website shows default content / "Could not load settings"** – the API is not running or `API_URL` is wrong. Start it with `npm run dev:server`.
- **Login fails with "Could not reach the API"** – check `NEXT_PUBLIC_API_URL` and that the API allows your website origin.
- **Images uploaded in the admin do not show** – `NEXT_PUBLIC_API_URL` must be reachable from the browser (uploads are served from `<API_URL>/uploads/...`).
- **Reset everything** – `npm run db:reset`.
