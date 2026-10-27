// Shapes returned by the CYP Furniture API (server/src/routes/*).

export type Paginated<T> = { items: T[]; total: number; page: number; pages: number; limit: number };

export type CategoryRef = { id: number; name: string; slug: string };

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  showInMenu: boolean;
  parentId: number | null;
  productCount: number;
  parent?: CategoryRef | null;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryNode = Category & { children: CategoryNode[] };

export type ProductImage = { id?: number; url: string; alt: string; sortOrder?: number };
export type ProductColor = { name: string; hex: string };
export type ProductOption = { name: string; values: string[] };
export type ProductSpec = { label: string; value: string };

export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categoryId: number | null;
  category: (CategoryRef & { parent: CategoryRef | null }) | null;
  images: ProductImage[];
  materials: string;
  dimensions: string;
  colors: ProductColor[];
  options: ProductOption[];
  specs: ProductSpec[];
  tags: string[];
  stock: number;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  readingTime: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Page = {
  id: number;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  options: Record<string, string>;
};

export type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  notes: string;
  status: OrderStatus;
  paymentMethod: 'cod' | 'bank_transfer' | 'whatsapp';
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminUser = { id: number; email: string; name: string };

export type UploadedFile = { url: string; name: string; size: number; type?: string; modifiedAt?: string };

// ----------------------------------------------------------------- settings

export type NavLink = { label: string; href: string; external: boolean };

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  secondaryText: string;
  secondaryLink: string;
  align: 'left' | 'center';
  theme: 'light' | 'dark';
};

export type Feature = { icon: string; title: string; subtitle: string };
export type Stat = { value: string; label: string };
export type ValueItem = { title: string; text: string; icon: string };
export type Testimonial = { name: string; role: string; quote: string; rating: number };
export type Banner = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  buttonText: string;
  buttonLink: string;
};

export type CurrencyOption = { code: string; symbol: string; label: string; rate: number; decimals: number };
export type CurrencyBase = { code: string; symbol: string; position: 'before' | 'after'; decimals: number };
/** Response of GET /api/currencies */
export type CurrencyPayload = { enabled: boolean; base: CurrencyBase; updatedAt: string; list: CurrencyOption[] };

export const HEADING_FONT_KEYS = ['marcellus', 'playfair', 'cormorant', 'dm-serif', 'libre-baskerville', 'montserrat', 'jost'] as const;
export const BODY_FONT_KEYS = ['jost', 'inter', 'montserrat', 'lato', 'nunito-sans', 'dm-sans', 'source-sans'] as const;
export type HeadingFont = (typeof HEADING_FONT_KEYS)[number];
export type BodyFont = (typeof BODY_FONT_KEYS)[number];

export type CommerceSettings = {
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimals: number;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  enableCod: boolean;
  enableBankTransfer: boolean;
  bankDetails: string;
  orderWhatsappEnabled: boolean;
  checkoutNote: string;
  showStock: boolean;
  lowStockThreshold: number;
  minOrderQuantity: number;
  /** Shown instead of a price when a product's price is 0 */
  quoteLabel: string;
};

export type SiteSettings = {
  brand: { siteName: string; tagline: string; logoUrl: string; logoOnDarkUrl: string; faviconUrl: string; logoText: string };
  contact: {
    email: string;
    phone: string;
    phoneSecondary: string;
    whatsapp: string;
    whatsappMessage: string;
    address: string;
    city: string;
    country: string;
    workingHours: string;
    mapEmbedUrl: string;
  };
  social: { tiktok: string; instagram: string; facebook: string; youtube: string; pinterest: string; x: string; linkedin: string };
  announcement: { enabled: boolean; text: string; link: string; linkText: string };
  hero: { slides: HeroSlide[]; autoplaySeconds: number };
  features: Feature[];
  home: {
    categoriesTitle: string;
    categoriesSubtitle: string;
    featuredTitle: string;
    featuredSubtitle: string;
    newArrivalsTitle: string;
    bestSellersTitle: string;
    blogTitle: string;
    blogSubtitle: string;
    marquee: string[];
    showcase: Banner;
    banner: Banner;
    testimonials: { enabled: boolean; title: string; subtitle: string; items: Testimonial[] };
    newsletter: { enabled: boolean; title: string; text: string };
  };
  about: {
    heroEyebrow: string;
    heroTitle: string;
    heroText: string;
    heroImage: string;
    storyTitle: string;
    story: string;
    storyImage: string;
    stats: Stat[];
    valuesTitle: string;
    values: ValueItem[];
    ctaTitle: string;
    ctaText: string;
  };
  footer: {
    description: string;
    copyright: string;
    columns: { title: string; links: NavLink[] }[];
    bottomLinks: NavLink[];
  };
  navigation: { showShopAll: boolean; showCategories: boolean; links: NavLink[] };
  seo: { metaTitle: string; metaDescription: string; keywords: string; ogImage: string; googleAnalyticsId: string; googleSiteVerification: string };
  commerce: CommerceSettings;
  currencies: { enabled: boolean; autoUpdate: boolean; updatedAt: string; ratesBase: string; list: CurrencyOption[] };
  theme: {
    accent: string;
    accentSecondary: string;
    accentSoft: string;
    surface: string;
    sale: string;
    headingFont: HeadingFont;
    bodyFont: BodyFont;
    baseFontSize: number;
  };
};

export type Stats = {
  counts: {
    products: number;
    activeProducts: number;
    categories: number;
    posts: number;
    publishedPosts: number;
    orders: number;
    pendingOrders: number;
    unreadMessages: number;
    subscribers: number;
    revenue: number;
  };
  ordersByStatus: Record<string, number>;
  recentOrders: Order[];
  lowStock: { id: number; name: string; slug: string; stock: number; images: ProductImage[] }[];
  topProducts: { id: number; name: string; slug: string; viewCount: number; price: number; images: ProductImage[] }[];
  recentMessages: ContactMessage[];
  sales: { date: string; orders: number; revenue: number }[];
  currency: CommerceSettings;
};

/** GET /api/stats/summary - numbers and latest activity for the admin shell */
export type StatsSummary = {
  orders: number;
  pendingOrders: number;
  unreadMessages: number;
  recentOrders: Pick<Order, 'id' | 'orderNumber' | 'customerName' | 'total' | 'status' | 'createdAt'>[];
  recentMessages: Pick<ContactMessage, 'id' | 'name' | 'subject' | 'isRead' | 'createdAt'>[];
};
