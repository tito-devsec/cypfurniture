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
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour like #EB001B')
    .default(fallback);

/** Parses "latitude, longitude" the way Google Maps copies it, e.g. "-6.7819, 39.2399". */
function parseCoordinates(value: string): { lat: number; lng: number } | null {
  const parts = value.split(',').map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}
const coordinates = () =>
  z
    .string()
    .trim()
    .max(80)
    .refine((v) => v === '' || parseCoordinates(v) !== null, 'Coordinates must be "latitude, longitude", e.g. -6.781925, 39.239961')
    .default('');
const httpsUrl = () =>
  z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v === '' || v.startsWith('https://'), 'Must be a full https:// address')
    .default('');

/// Font choices available in the admin (the storefront bundles exactly these Google Fonts)
export const HEADING_FONT_KEYS = ['marcellus', 'playfair', 'cormorant', 'dm-serif', 'libre-baskerville', 'montserrat', 'jost'] as const;
export const BODY_FONT_KEYS = ['jost', 'inter', 'montserrat', 'lato', 'nunito-sans', 'dm-sans', 'source-sans'] as const;

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
    mapPlaceName: text(120),
    mapCoordinates: coordinates(),
    mapEmbedOverride: httpsUrl(),
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
    /// Phrases shown in the scrolling ticker; falls back to the trust badges when empty
    marquee: z.array(text(80)).max(12).default([]),
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
    keywords: text(400),
    ogImage: url(),
    /// e.g. G-XXXXXXXXXX (Google Analytics 4 measurement id)
    googleAnalyticsId: text(40),
    /// content of the google-site-verification meta tag from Google Search Console
    googleSiteVerification: text(120),
  }),
  commerce: z.object({
    currencyCode: z.string().min(1).max(8).default('TZS'),
    currencySymbol: z.string().max(8).default('TSh'),
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
    /// Label shown instead of a price when a product has no price (price = 0)
    quoteLabel: z.string().max(60).default('Request a quote'),
  }),
  /// Currency converter shown in the storefront top bar. Rates are "1 base currency = rate".
  currencies: z.object({
    enabled: z.boolean().default(true),
    autoUpdate: z.boolean().default(true),
    /// ISO date of the last successful rate refresh
    updatedAt: text(40),
    /// Base currency the stored rates were fetched for
    ratesBase: text(8),
    list: z
      .array(
        z.object({
          code: z.string().trim().toUpperCase().length(3),
          symbol: z.string().max(8).default(''),
          label: text(40),
          rate: z.number().positive().default(1),
          decimals: z.number().int().min(0).max(3).default(2),
        }),
      )
      .max(40)
      .default([]),
  }),
  theme: z.object({
    accent: hex('#EB001B'),
    accentSecondary: hex('#F79E1B'),
    accentSoft: hex('#FBE9D3'),
    surface: hex('#F6EFEA'),
    sale: hex('#EB001B'),
    headingFont: z.enum(HEADING_FONT_KEYS).default('marcellus'),
    bodyFont: z.enum(BODY_FONT_KEYS).default('jost'),
    /// Root font size in px; everything scales with it
    baseFontSize: z.number().int().min(14).max(20).default(16),
  }),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

const img = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    siteName: 'CYP Furniture & Decor®',
    tagline: 'Beyond Furniture. Designed for Living.',
    logoUrl: '/logo-mark.png',
    logoOnDarkUrl: '',
    faviconUrl: '',
    logoText: 'CYP',
  },
  contact: {
    email: 'info@cypfurniture.com',
    phone: '+255 686 552 000',
    phoneSecondary: '+255 742 050 606',
    whatsapp: '255686552000',
    whatsappMessage: 'Hello CYP Furniture & Decor, I would like to ask about ',
    address: 'Kijitonyama',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    workingHours: '',
    // Showroom pin: the name of the Google Maps listing and its exact position
    mapPlaceName: 'CYP Furniture',
    mapCoordinates: '-6.781925944125291, 39.239961853097746',
    mapEmbedOverride: '',
  },
  social: {
    tiktok: 'https://www.tiktok.com/@cyp_furnitures',
    instagram: 'https://www.instagram.com/cyp_furnitures',
    facebook: 'https://www.facebook.com/cypfurnitures',
    youtube: '',
    pinterest: '',
    x: '',
    linkedin: '',
  },
  announcement: {
    enabled: true,
    text: 'Beyond Furniture. Designed for Living. Handcrafted in Tanzania.',
    link: '/contact',
    linkText: 'Request a custom design',
  },
  hero: {
    autoplaySeconds: 6,
    slides: [
      {
        id: 'slide-1',
        eyebrow: 'CYP Furniture & Decor®',
        title: 'Beyond Furniture. Designed for Living.',
        subtitle: 'Luxury furniture, bespoke design and interior solutions, handcrafted in Tanzania for homes, offices and commercial spaces.',
        image: img('1555041469-a586c61ea9bc'),
        ctaText: 'Explore collections',
        ctaLink: '/shop',
        secondaryText: 'Request a custom design',
        secondaryLink: '/contact',
        align: 'left',
        theme: 'dark',
      },
      {
        id: 'slide-2',
        eyebrow: 'Bespoke design & custom orders',
        title: 'We create the impossible.',
        subtitle: 'Tell us your dimensions, materials, finishes and colours. Our workshop in Dar es Salaam builds furniture made only for you.',
        image: img('1533090481720-856c6e3c1fdc'),
        ctaText: 'Request a custom design',
        ctaLink: '/contact',
        secondaryText: 'Our story',
        secondaryLink: '/about',
        align: 'left',
        theme: 'dark',
      },
      {
        id: 'slide-3',
        eyebrow: 'Interior design',
        title: 'Behind every original CYP.',
        subtitle: 'Complete interior solutions from the first sketch to installation, for living rooms, bedrooms, offices and more.',
        image: img('1497366216548-37526070297c'),
        ctaText: 'Contact us',
        ctaLink: '/contact',
        secondaryText: 'View projects',
        secondaryLink: '/blog',
        align: 'left',
        theme: 'dark',
      },
    ],
  },
  features: [
    { icon: 'hammer', title: 'Handcrafted in Tanzania', subtitle: 'Made in our Dar es Salaam workshop' },
    { icon: 'ruler', title: 'Bespoke design', subtitle: 'Any size, material or finish' },
    { icon: 'sparkles', title: 'Interior solutions', subtitle: 'From concept to installation' },
    { icon: 'headset', title: 'Direct support', subtitle: 'Talk to us on WhatsApp' },
  ],
  home: {
    categoriesTitle: 'Furniture collections',
    categoriesSubtitle: 'Luxury furniture, bespoke design and interior solutions for every room.',
    featuredTitle: 'Featured furniture',
    featuredSubtitle: 'Selected pieces from the CYP workshop.',
    newArrivalsTitle: 'New arrivals',
    bestSellersTitle: 'Customer favourites',
    blogTitle: 'Projects & inspiration',
    blogSubtitle: 'Completed projects, custom furniture and ideas from CYP Furniture & Decor®.',
    marquee: [
      'Beyond Furniture. Designed for Living.',
      'We create the impossible.',
      'Behind every original CYP.',
      'Handcrafted in Tanzania',
      'Luxury Furniture',
      'Bespoke Design',
      'Interior Design',
    ],
    showcase: {
      enabled: true,
      eyebrow: 'Bespoke design & custom orders',
      title: 'Furniture tailored to your dimensions, materials and finishes',
      text: 'Tell us about your space and we design, build and install furniture made only for you. Choose the wood, fabric, colour and finish; our craftsmen in Dar es Salaam do the rest.',
      image: img('1586023492125-27b2c045efd7'),
      buttonText: 'Request a custom design',
      buttonLink: '/contact',
    },
    banner: {
      enabled: true,
      eyebrow: 'CYP Furniture & Decor®',
      title: 'Beyond Furniture. Designed for Living.',
      text: 'Premium furniture, bespoke design and interior solutions for homes, offices and commercial spaces. Handcrafted in Tanzania.',
      image: img('1600210492486-724fe5c67fb0'),
      buttonText: 'Contact us',
      buttonLink: '/contact',
    },
    testimonials: {
      enabled: false,
      title: 'What our clients say',
      subtitle: 'Homes, offices and projects furnished by CYP.',
      items: [],
    },
    newsletter: {
      enabled: true,
      title: 'Stay inspired',
      text: 'New collections, projects and design ideas from CYP Furniture & Decor®. No spam, unsubscribe any time.',
    },
  },
  about: {
    heroEyebrow: 'About CYP Furniture & Decor®',
    heroTitle: 'Premium furniture, handcrafted in Tanzania',
    heroText: 'CYP Furniture & Decor® designs and builds luxury furniture, bespoke pieces and complete interiors from our workshop in Kijitonyama, Dar es Salaam. Every original CYP piece is handcrafted with care for homes, offices and commercial spaces in Tanzania and beyond.',
    heroImage: img('1600585154340-be6161a56a0c'),
    storyTitle: 'Behind every original CYP',
    story: 'CYP Furniture & Decor® was built on one belief: furniture should go beyond function. It should be designed for living.\n\nFrom our workshop in Dar es Salaam we combine traditional craftsmanship with modern design to create sofas, beds, wardrobes, dining sets, office furniture and fully custom pieces. Each item is handcrafted in Tanzania, finished by hand and checked before it leaves the workshop.\n\nAlongside furniture we offer bespoke design and complete interior solutions, from the first sketch to installation. We create the impossible, so your space can be exactly as you imagined it.',
    storyImage: img('1497366754035-f200968a6e72'),
    stats: [
      { value: '100%', label: 'Handcrafted in Tanzania' },
      { value: 'Bespoke', label: 'Made to your dimensions' },
      { value: 'Luxury', label: 'Premium materials & finishes' },
      { value: 'Interiors', label: 'Complete design solutions' },
    ],
    valuesTitle: 'What we stand for',
    values: [
      { icon: 'hammer', title: 'Craftsmanship', text: 'Handcrafted in Tanzania by skilled artisans and finished by hand.' },
      { icon: 'sparkles', title: 'Originality', text: 'Every piece is an original CYP, designed for your space, never copied.' },
      { icon: 'gem', title: 'Quality', text: 'Premium materials, honest construction and careful finishing on every order.' },
      { icon: 'heart', title: 'Reliability', text: 'Clear communication, agreed timelines and support long after delivery.' },
    ],
    ctaTitle: 'Have a project in mind?',
    ctaText: 'From a single bespoke piece to a complete interior, tell us what you imagine.',
  },
  footer: {
    description: 'CYP Furniture & Decor® creates luxury furniture, bespoke designs and interior solutions. Handcrafted in Tanzania, in Kijitonyama, Dar es Salaam.',
    copyright: '© {year} CYP Furniture & Decor®. All rights reserved.',
    columns: [
      {
        title: 'Collections',
        links: [
          { label: 'All collections', href: '/shop', external: false },
          { label: 'Living room', href: '/category/living-room', external: false },
          { label: 'Bedroom', href: '/category/bedroom', external: false },
          { label: 'Dining', href: '/category/dining', external: false },
          { label: 'Office furniture', href: '/category/office-furniture', external: false },
          { label: 'Custom-made furniture', href: '/category/custom-made-furniture', external: false },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About us', href: '/about', external: false },
          { label: 'Projects & inspiration', href: '/blog', external: false },
          { label: 'Request a custom design', href: '/contact', external: false },
          { label: 'Track your order', href: '/track', external: false },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'Delivery & installation', href: '/p/shipping-delivery', external: false },
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
    metaTitle: 'CYP Furniture & Decor® | Luxury & Custom Furniture in Dar es Salaam, Tanzania',
    metaDescription: 'CYP Furniture & Decor® creates luxury furniture, bespoke custom-made pieces and interior design solutions, handcrafted in Tanzania. Visit us in Kijitonyama, Dar es Salaam, or request a custom design online.',
    keywords: 'custom furniture Dar es Salaam, luxury furniture Tanzania, bespoke furniture Tanzania, furniture manufacturers Dar es Salaam, interior design Tanzania, custom furniture Tanzania, CYP Furniture',
    ogImage: '/og-image.jpg',
    googleAnalyticsId: '',
    googleSiteVerification: '',
  },
  commerce: {
    currencyCode: 'TZS',
    currencySymbol: 'TSh',
    currencyPosition: 'before',
    decimals: 0,
    shippingFlatRate: 0,
    freeShippingThreshold: 0,
    enableCod: true,
    enableBankTransfer: true,
    bankDetails: 'Our team shares the bank details when confirming your order.',
    orderWhatsappEnabled: true,
    checkoutNote: 'Our team contacts you on WhatsApp or by phone to confirm your order, delivery and payment.',
    showStock: false,
    lowStockThreshold: 3,
    minOrderQuantity: 1,
    quoteLabel: 'Request a quote',
  },
  currencies: {
    enabled: true,
    autoUpdate: true,
    updatedAt: '',
    ratesBase: 'TZS',
    // Approximate starting rates (1 TZS = rate); refreshed automatically from open.er-api.com
    list: [
      { code: 'USD', symbol: '$', label: 'US Dollar', rate: 0.000378, decimals: 2 },
      { code: 'EUR', symbol: '€', label: 'Euro', rate: 0.00034, decimals: 2 },
      { code: 'GBP', symbol: '£', label: 'British Pound', rate: 0.000285, decimals: 2 },
      { code: 'AED', symbol: 'AED', label: 'UAE Dirham', rate: 0.00139, decimals: 2 },
      { code: 'SAR', symbol: 'SAR', label: 'Saudi Riyal', rate: 0.001419, decimals: 2 },
      { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling', rate: 0.048974, decimals: 0 },
      { code: 'UGX', symbol: 'USh', label: 'Ugandan Shilling', rate: 1.60833, decimals: 0 },
      { code: 'ZAR', symbol: 'R', label: 'South African Rand', rate: 0.006255, decimals: 2 },
      { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', rate: 0.002529, decimals: 2 },
      { code: 'INR', symbol: '₹', label: 'Indian Rupee', rate: 0.035846, decimals: 0 },
      { code: 'JPY', symbol: '¥', label: 'Japanese Yen', rate: 0.059421, decimals: 0 },
      { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar', rate: 0.000522, decimals: 2 },
      { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', rate: 0.000537, decimals: 2 },
      { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc', rate: 0.000316, decimals: 2 },
    ],
  },
  theme: {
    accent: '#EB001B',
    accentSecondary: '#F79E1B',
    accentSoft: '#FBE9D3',
    surface: '#F6EFEA',
    sale: '#EB001B',
    headingFont: 'marcellus',
    bodyFont: 'jost',
    baseFontSize: 16,
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
