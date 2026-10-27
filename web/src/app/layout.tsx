import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import Script from 'next/script';
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
  const description = settings.seo.metaDescription || settings.brand.tagline;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${settings.brand.siteName}` },
    description,
    keywords: settings.seo.keywords ? settings.seo.keywords.split(',').map((k) => k.trim()) : undefined,
    alternates: { canonical: './' },
    icons: settings.brand.faviconUrl ? { icon: resolveImage(settings.brand.faviconUrl) } : undefined,
    verification: settings.seo.googleSiteVerification ? { google: settings.seo.googleSiteVerification } : undefined,
    openGraph: {
      title,
      description,
      siteName: settings.brand.siteName,
      type: 'website',
      images: settings.seo.ogImage ? [resolveImage(settings.seo.ogImage)] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: settings.seo.ogImage ? [resolveImage(settings.seo.ogImage)] : undefined },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const themeVars = {
    '--accent': settings.theme.accent,
    '--accent-2': settings.theme.accentSecondary,
    '--accent-soft': settings.theme.accentSoft,
    '--surface': settings.theme.surface,
    '--sale': settings.theme.sale,
  } as CSSProperties;
  const gaId = settings.seo.googleAnalyticsId.trim();

  return (
    <html lang="en" className={`${marcellus.variable} ${jost.variable} h-full`} style={themeVars}>
      <body className="flex min-h-full flex-col">
        {children}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId.replace(/[^A-Za-z0-9-]/g, '')}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
