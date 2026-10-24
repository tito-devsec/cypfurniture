import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Marcellus, Jost } from 'next/font/google';
import { getSettings } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import './globals.css';

const marcellus = Marcellus({ weight: '400', subsets: ['latin'], variable: '--font-marcellus', display: 'swap' });
const jost = Jost({ subsets: ['latin'], variable: '--font-jost', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seo.metaTitle || settings.brand.siteName;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${settings.brand.siteName}` },
    description: settings.seo.metaDescription || settings.brand.tagline,
    keywords: settings.seo.keywords ? settings.seo.keywords.split(',').map((k) => k.trim()) : undefined,
    icons: settings.brand.faviconUrl ? { icon: resolveImage(settings.brand.faviconUrl) } : undefined,
    openGraph: {
      title,
      description: settings.seo.metaDescription || settings.brand.tagline,
      siteName: settings.brand.siteName,
      type: 'website',
      images: settings.seo.ogImage ? [resolveImage(settings.seo.ogImage)] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const themeVars = {
    '--accent': settings.theme.accent,
    '--accent-soft': settings.theme.accentSoft,
    '--surface': settings.theme.surface,
    '--sale': settings.theme.sale,
  } as CSSProperties;

  return (
    <html lang="en" className={`${marcellus.variable} ${jost.variable} h-full`} style={themeVars}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
