import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import Script from 'next/script';
import {
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Inter,
  Jost,
  Lato,
  Libre_Baskerville,
  Marcellus,
  Montserrat,
  Nunito_Sans,
  Playfair_Display,
  Source_Sans_3,
} from 'next/font/google';
import { getSettings } from '@/lib/api';
import type { BodyFont, HeadingFont } from '@/lib/types';
import { resolveImage } from '@/lib/utils';
import './globals.css';

// Fonts selectable in Admin → Settings → Brand & theme. Only the chosen ones are downloaded by the browser.
const marcellus = Marcellus({ weight: '400', subsets: ['latin'], display: 'swap' });
const jost = Jost({ subsets: ['latin'], display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: false });
const cormorant = Cormorant_Garamond({ weight: ['400', '500', '600'], subsets: ['latin'], display: 'swap', preload: false });
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], display: 'swap', preload: false });
const libreBaskerville = Libre_Baskerville({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', preload: false });
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', preload: false });
const inter = Inter({ subsets: ['latin'], display: 'swap', preload: false });
const lato = Lato({ weight: ['300', '400', '700'], subsets: ['latin'], display: 'swap', preload: false });
const nunitoSans = Nunito_Sans({ subsets: ['latin'], display: 'swap', preload: false });
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', preload: false });
const sourceSans = Source_Sans_3({ subsets: ['latin'], display: 'swap', preload: false });

const HEADING_FONTS: Record<HeadingFont, { style: { fontFamily: string } }> = {
  marcellus,
  playfair,
  cormorant,
  'dm-serif': dmSerif,
  'libre-baskerville': libreBaskerville,
  montserrat,
  jost,
};
const BODY_FONTS: Record<BodyFont, { style: { fontFamily: string } }> = {
  jost,
  inter,
  montserrat,
  lato,
  'nunito-sans': nunitoSans,
  'dm-sans': dmSans,
  'source-sans': sourceSans,
};

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
  const { theme } = settings;
  const heading = HEADING_FONTS[theme.headingFont] ?? marcellus;
  const body = BODY_FONTS[theme.bodyFont] ?? jost;
  const themeVars = {
    '--accent': theme.accent,
    '--accent-2': theme.accentSecondary,
    '--accent-soft': theme.accentSoft,
    '--surface': theme.surface,
    '--sale': theme.sale,
    '--font-display-family': heading.style.fontFamily,
    '--font-body-family': body.style.fontFamily,
    fontSize: `${theme.baseFontSize || 16}px`,
  } as CSSProperties;
  const gaId = settings.seo.googleAnalyticsId.trim();

  return (
    <html lang="en" className="h-full" style={themeVars}>
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
