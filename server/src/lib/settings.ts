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
    /// Label shown instead of a price when a product has no price (price = 0)
    quoteLabel: z.string().max(60).default('Request a quote'),
  }),
  theme: z.object({
    accent: hex('#EB001B'),
    accentSecondary: hex('#F79E1B'),
    accentSoft: hex('#FBE9D3'),
    surface: hex('#F6EFEA'),
    sale: hex('#EB001B'),
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
    mapEmbedUrl: 'https://www.google.com/maps?q=Kijitonyama,+Dar+es+Salaam,+Tanzania&output=embed',
  },
  social: {
    tiktok: '',
    instagram: 'https://www.instagram.com/cyp_furnitures',
    facebook: '',
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
    currencyCode: 'USD',
    currencySymbol: '$',
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
  theme: {
    accent: '#EB001B',
    accentSecondary: '#F79E1B',
    accentSoft: '#FBE9D3',
    surface: '#F6EFEA',
    sale: '#EB001B',
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
