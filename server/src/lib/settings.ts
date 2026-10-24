import { z } from 'zod';
import { prisma } from './prisma.ts';
import { deepMerge, parseJson } from './json.ts';

// ---------------------------------------------------------------------------
// Validation schema - everything the admin can customise about the website.
// New fields can be added here with a default and will be merged automatically
// into existing databases (no migration needed).
// ---------------------------------------------------------------------------

const text = (max = 2000) => z.string().max(max).default('');
const url = () => z.string().max(1000).default('');
const hex = (fallback: string) =>
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour like #1F3D33')
    .default(fallback);

const linkSchema = z.object({ label: text(80), href: text(500), external: z.boolean().default(false) });

const heroSlideSchema = z.object({
  id: text(40),
  eyebrow: text(80),
  title: text(140),
  subtitle: text(300),
  image: url(),
  ctaText: text(60),
  ctaLink: text(500),
  secondaryText: text(60),
  secondaryLink: text(500),
  align: z.enum(['left', 'center']).default('left'),
  theme: z.enum(['light', 'dark']).default('light'),
});

const featureSchema = z.object({ icon: text(40), title: text(80), subtitle: text(160) });
const statSchema = z.object({ value: text(40), label: text(80) });
const valueSchema = z.object({ title: text(80), text: text(400), icon: text(40) });
const testimonialSchema = z.object({ name: text(80), role: text(80), quote: text(600), rating: z.number().min(1).max(5).default(5) });
const bannerSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: text(80),
  title: text(140),
  text: text(400),
  image: url(),
  buttonText: text(60),
  buttonLink: text(500),
});

export const settingsSchema = z.object({
  brand: z.object({
    siteName: text(80),
    tagline: text(160),
    logoUrl: url(),
    logoOnDarkUrl: url(),
    faviconUrl: url(),
    logoText: text(40),
  }),
  contact: z.object({
    email: text(120),
    phone: text(60),
    phoneSecondary: text(60),
    whatsapp: text(30),
    whatsappMessage: text(300),
    address: text(300),
    city: text(80),
    country: text(80),
    workingHours: text(200),
    mapEmbedUrl: url(),
  }),
  social: z.object({
    tiktok: url(),
    instagram: url(),
    facebook: url(),
    youtube: url(),
    pinterest: url(),
    x: url(),
    linkedin: url(),
  }),
  announcement: z.object({
    enabled: z.boolean().default(true),
    text: text(200),
    link: text(500),
    linkText: text(60),
  }),
  hero: z.object({
    slides: z.array(heroSlideSchema).default([]),
    autoplaySeconds: z.number().min(0).max(60).default(6),
  }),
  features: z.array(featureSchema).default([]),
  home: z.object({
    categoriesTitle: text(120),
    categoriesSubtitle: text(200),
    featuredTitle: text(120),
    featuredSubtitle: text(200),
    newArrivalsTitle: text(120),
    bestSellersTitle: text(120),
    blogTitle: text(120),
    blogSubtitle: text(200),
    showcase: bannerSchema,
    banner: bannerSchema,
    testimonials: z.object({
      enabled: z.boolean().default(true),
      title: text(120),
      subtitle: text(200),
      items: z.array(testimonialSchema).default([]),
    }),
    newsletter: z.object({ enabled: z.boolean().default(true), title: text(120), text: text(300) }),
  }),
  about: z.object({
    heroEyebrow: text(80),
    heroTitle: text(140),
    heroText: text(600),
    heroImage: url(),
    storyTitle: text(140),
    story: text(8000),
    storyImage: url(),
    stats: z.array(statSchema).default([]),
    valuesTitle: text(120),
    values: z.array(valueSchema).default([]),
    ctaTitle: text(140),
    ctaText: text(400),
  }),
  footer: z.object({
    description: text(400),
    copyright: text(200),
    columns: z.array(z.object({ title: text(60), links: z.array(linkSchema).default([]) })).default([]),
    bottomLinks: z.array(linkSchema).default([]),
  }),
  navigation: z.object({
    showShopAll: z.boolean().default(true),
    showCategories: z.boolean().default(true),
    links: z.array(linkSchema).default([]),
  }),
  seo: z.object({
    metaTitle: text(120),
    metaDescription: text(300),
    keywords: text(300),
    ogImage: url(),
  }),
  commerce: z.object({
    currencyCode: z.string().min(1).max(8).default('USD'),
    currencySymbol: z.string().max(8).default('$'),
    currencyPosition: z.enum(['before', 'after']).default('before'),
    decimals: z.number().int().min(0).max(3).default(0),
    shippingFlatRate: z.number().min(0).default(0),
    freeShippingThreshold: z.number().min(0).default(0),
    enableCod: z.boolean().default(true),
    enableBankTransfer: z.boolean().default(true),
    bankDetails: text(1000),
    orderWhatsappEnabled: z.boolean().default(true),
    checkoutNote: text(500),
    showStock: z.boolean().default(true),
    lowStockThreshold: z.number().int().min(0).default(3),
    minOrderQuantity: z.number().int().min(1).default(1),
  }),
  theme: z.object({
    accent: hex('#1F3D33'),
    accentSoft: hex('#E7EFEA'),
    surface: hex('#F6F4EF'),
    sale: hex('#B23A2E'),
  }),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

const img = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    siteName: 'CYP Furniture',
    tagline: 'Furniture for every space - home, office and beyond.',
    logoUrl: '',
    logoOnDarkUrl: '',
    faviconUrl: '',
    logoText: 'CYP',
  },
  contact: {
    email: 'hello@cypfurniture.com',
    phone: '+971 4 000 0000',
    phoneSecondary: '',
    whatsapp: '971500000000',
    whatsappMessage: 'Hello CYP Furniture, I would like to ask about ',
    address: 'Showroom 12, Al Quoz Industrial Area 3',
    city: 'Dubai',
    country: 'United Arab Emirates',
    workingHours: 'Sat - Thu: 9:00 - 21:00 | Fri: 14:00 - 21:00',
    mapEmbedUrl: '',
  },
  social: {
    tiktok: 'https://www.tiktok.com/@cypfurniture',
    instagram: 'https://www.instagram.com/cypfurniture',
    facebook: 'https://www.facebook.com/cypfurniture',
    youtube: '',
    pinterest: '',
    x: '',
    linkedin: '',
  },
  announcement: {
    enabled: true,
    text: 'Free delivery on orders over $999 - Made-to-order furniture available',
    link: '/shop',
    linkText: 'Shop now',
  },
  hero: {
    autoplaySeconds: 6,
    slides: [
      {
        id: 'slide-1',
        eyebrow: 'New collection 2026',
        title: 'Design that feels like home',
        subtitle: 'Handcrafted sofas, beds and dining sets made for everyday living. Built to last, designed to be loved.',
        image: img('1555041469-a586c61ea9bc'),
        ctaText: 'Shop the collection',
        ctaLink: '/shop',
        secondaryText: 'Our story',
        secondaryLink: '/about',
        align: 'left',
        theme: 'dark',
      },
      {
        id: 'slide-2',
        eyebrow: 'Office & workspace',
        title: 'Workspaces that work harder',
        subtitle: 'Ergonomic desks, executive chairs and smart storage for offices of every size.',
        image: img('1497366216548-37526070297c'),
        ctaText: 'Explore office',
        ctaLink: '/category/office',
        secondaryText: 'Request a quote',
        secondaryLink: '/contact',
        align: 'left',
        theme: 'dark',
      },
      {
        id: 'slide-3',
        eyebrow: 'Made to order',
        title: 'Custom pieces, crafted to your measure',
        subtitle: 'Tell us about your space. Our workshop designs, builds and delivers furniture made just for you.',
        image: img('1616486338812-3dadae4b4ace'),
        ctaText: 'Start a project',
        ctaLink: '/contact',
        secondaryText: 'View projects',
        secondaryLink: '/blog',
        align: 'left',
        theme: 'dark',
      },
    ],
  },
  features: [
    { icon: 'truck', title: 'Free delivery', subtitle: 'On orders over $999' },
    { icon: 'shield', title: '10-year warranty', subtitle: 'On all solid wood frames' },
    { icon: 'ruler', title: 'Made to measure', subtitle: 'Custom sizes & finishes' },
    { icon: 'refresh', title: '30-day returns', subtitle: 'Easy, hassle-free returns' },
  ],
  home: {
    categoriesTitle: 'Shop by room',
    categoriesSubtitle: 'Everything you need for the home and the office, curated by space.',
    featuredTitle: 'Featured pieces',
    featuredSubtitle: 'Hand-picked designs our customers love this season.',
    newArrivalsTitle: 'New arrivals',
    bestSellersTitle: 'Best sellers',
    blogTitle: 'Inspiration & tips',
    blogSubtitle: 'Ideas, guides and stories from the CYP workshop.',
    showcase: {
      enabled: true,
      eyebrow: 'Explore our latest design',
      title: 'Thoughtfully designed for timeless style and everyday comfort',
      text: 'Every CYP piece starts with solid materials and honest construction. The result is furniture that looks as good in ten years as it does today.',
      image: img('1586023492125-27b2c045efd7'),
      buttonText: 'Shop living room',
      buttonLink: '/category/living-room',
    },
    banner: {
      enabled: true,
      eyebrow: 'Showroom',
      title: 'Visit our showroom and feel the difference',
      text: 'Sit, touch and compare hundreds of pieces in person. Our design consultants are happy to help you plan a whole room.',
      image: img('1600210492486-724fe5c67fb0'),
      buttonText: 'Plan your visit',
      buttonLink: '/contact',
    },
    testimonials: {
      enabled: true,
      title: 'What our customers say',
      subtitle: 'Thousands of homes and offices furnished with care.',
      items: [
        {
          name: 'Sarah M.',
          role: 'Homeowner, Dubai Hills',
          quote: 'The sofa arrived exactly as described and the finish is flawless. The team even helped us pick the right fabric for our living room.',
          rating: 5,
        },
        {
          name: 'Omar K.',
          role: 'Founder, Studio Nine',
          quote: 'We furnished a 40-desk office in three weeks. Great quality, fair pricing and a delivery team that actually shows up on time.',
          rating: 5,
        },
        {
          name: 'Elena P.',
          role: 'Interior designer',
          quote: 'CYP is my go-to for made-to-measure dining tables. Beautiful oak, precise dimensions and a very responsive workshop.',
          rating: 5,
        },
      ],
    },
    newsletter: {
      enabled: true,
      title: 'Join the CYP circle',
      text: 'New collections, design tips and private offers. No spam, unsubscribe any time.',
    },
  },
  about: {
    heroEyebrow: 'About CYP Furniture',
    heroTitle: 'Honest furniture, made with care',
    heroText: 'CYP Furniture designs and manufactures furniture for homes, offices and commercial spaces. From a single armchair to a complete office fit-out, every piece is built in our own workshop by people who care about the details.',
    heroImage: img('1600585154340-be6161a56a0c'),
    storyTitle: 'From a small workshop to homes everywhere',
    story: 'CYP Furniture started as a two-person carpentry workshop with one simple belief: good furniture should be built to last, priced fairly and designed to fit real life.\n\nToday our team of craftsmen, designers and project managers delivers everything from living room sets to complete office interiors. We source solid hardwoods, premium fabrics and certified foams, and we finish every piece by hand before it leaves the workshop.\n\nWhether you are furnishing a new apartment, upgrading a workspace or looking for a one-of-a-kind custom piece, we are here to help you create spaces that feel like you.',
    storyImage: img('1497366754035-f200968a6e72'),
    stats: [
      { value: '15+', label: 'Years of craftsmanship' },
      { value: '2,400+', label: 'Projects delivered' },
      { value: '60', label: 'Skilled craftsmen' },
      { value: '2', label: 'Showrooms' },
    ],
    valuesTitle: 'What we stand for',
    values: [
      { icon: 'hammer', title: 'Craftsmanship', text: 'Solid joinery, hand finishing and quality checks on every single piece.' },
      { icon: 'leaf', title: 'Sustainability', text: 'Responsibly sourced timber, low-VOC finishes and furniture built to last decades.' },
      { icon: 'sparkles', title: 'Design', text: 'Clean, timeless forms that work with any interior - never trend-chasing.' },
      { icon: 'heart', title: 'Service', text: 'Honest advice, on-time delivery and a team that is here long after the sale.' },
    ],
    ctaTitle: 'Have a project in mind?',
    ctaText: 'From a single piece to a full fit-out, we would love to hear about it.',
  },
  footer: {
    description: 'CYP Furniture crafts furniture for homes, offices and commercial spaces. Visit our showroom or shop online with delivery across the region.',
    copyright: '© {year} CYP Furniture. All rights reserved.',
    columns: [
      {
        title: 'Shop',
        links: [
          { label: 'All products', href: '/shop', external: false },
          { label: 'Living room', href: '/category/living-room', external: false },
          { label: 'Bedroom', href: '/category/bedroom', external: false },
          { label: 'Dining', href: '/category/dining', external: false },
          { label: 'Office', href: '/category/office', external: false },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About us', href: '/about', external: false },
          { label: 'Blog', href: '/blog', external: false },
          { label: 'Contact', href: '/contact', external: false },
          { label: 'Track your order', href: '/track', external: false },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'Shipping & delivery', href: '/p/shipping-delivery', external: false },
          { label: 'Returns & warranty', href: '/p/returns-warranty', external: false },
          { label: 'FAQ', href: '/p/faq', external: false },
          { label: 'Privacy policy', href: '/p/privacy-policy', external: false },
        ],
      },
    ],
    bottomLinks: [
      { label: 'Terms of service', href: '/p/terms', external: false },
      { label: 'Privacy policy', href: '/p/privacy-policy', external: false },
    ],
  },
  navigation: {
    showShopAll: true,
    showCategories: true,
    links: [
      { label: 'Blog', href: '/blog', external: false },
      { label: 'About', href: '/about', external: false },
      { label: 'Contact', href: '/contact', external: false },
    ],
  },
  seo: {
    metaTitle: 'CYP Furniture | Home & Office Furniture',
    metaDescription: 'Shop sofas, beds, dining sets, office furniture and custom-made pieces from CYP Furniture. Quality craftsmanship, fair prices and delivery to your door.',
    keywords: 'furniture, sofas, office furniture, dining tables, beds, custom furniture',
    ogImage: '',
  },
  commerce: {
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    decimals: 0,
    shippingFlatRate: 49,
    freeShippingThreshold: 999,
    enableCod: true,
    enableBankTransfer: true,
    bankDetails: 'Bank: Example Bank\nAccount name: CYP Furniture LLC\nIBAN: AE00 0000 0000 0000 0000 000\nPlease use your order number as the payment reference.',
    orderWhatsappEnabled: true,
    checkoutNote: 'Our team will contact you within 24 hours to confirm your order, delivery date and payment.',
    showStock: true,
    lowStockThreshold: 3,
    minOrderQuantity: 1,
  },
  theme: {
    accent: '#1F3D33',
    accentSoft: '#E7EFEA',
    surface: '#F6F4EF',
    sale: '#B23A2E',
  },
};

export async function getSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const stored = parseJson<Partial<SiteSettings>>(row?.data, {});
  const merged = deepMerge(DEFAULT_SETTINGS, stored);
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

/** Deep-merges a partial patch into the stored settings, validates and persists. */
export async function updateSettings(patch: unknown): Promise<SiteSettings> {
  const current = await getSettings();
  const merged = deepMerge(current, patch);
  const data = settingsSchema.parse(merged);
  const json = JSON.stringify(data);
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, data: json },
    update: { data: json },
  });
  return data;
}

export async function resetSettings(): Promise<SiteSettings> {
  const json = JSON.stringify(DEFAULT_SETTINGS);
  await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, data: json }, update: { data: json } });
  return DEFAULT_SETTINGS;
}
