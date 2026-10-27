import type { ReactNode } from 'react';
import { getCategoryTree, getSettings } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import { SiteProvider } from '@/components/site/site-provider';
import { AnnouncementBar } from '@/components/site/announcement-bar';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { CartDrawer } from '@/components/site/cart-drawer';
import { FloatingActions } from '@/components/site/floating';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategoryTree()]);
  const { brand, contact, social } = settings;

  // Structured data for search engines (local business + organisation)
  const sameAs = Object.values(social).filter(Boolean);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness', 'FurnitureStore'],
    name: brand.siteName,
    slogan: brand.tagline,
    url: SITE_URL,
    logo: brand.logoUrl ? `${SITE_URL}${brand.logoUrl.startsWith('/') && !brand.logoUrl.startsWith('/uploads/') ? brand.logoUrl : ''}` || resolveImage(brand.logoUrl) : undefined,
    image: settings.seo.ogImage ? resolveImage(settings.seo.ogImage) : undefined,
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    address:
      contact.address || contact.city
        ? { '@type': 'PostalAddress', streetAddress: contact.address || undefined, addressLocality: contact.city || undefined, addressCountry: contact.country || undefined }
        : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };

  return (
    <SiteProvider settings={settings} categories={categories}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <FloatingActions />
    </SiteProvider>
  );
}
