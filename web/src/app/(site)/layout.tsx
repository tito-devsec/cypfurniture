import type { ReactNode } from 'react';
import { getCategoryTree, getSettings } from '@/lib/api';
import { SiteProvider } from '@/components/site/site-provider';
import { AnnouncementBar } from '@/components/site/announcement-bar';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { CartDrawer } from '@/components/site/cart-drawer';
import { FloatingActions } from '@/components/site/floating';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategoryTree()]);
  return (
    <SiteProvider settings={settings} categories={categories}>
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
