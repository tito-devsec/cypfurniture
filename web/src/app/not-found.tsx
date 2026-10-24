import { ArrowRight } from 'lucide-react';
import { getCategoryTree, getSettings } from '@/lib/api';
import { SiteProvider } from '@/components/site/site-provider';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { CartDrawer } from '@/components/site/cart-drawer';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const [settings, categories] = await Promise.all([getSettings(), getCategoryTree()]);
  return (
    <SiteProvider settings={settings} categories={categories}>
      <Header />
      <main className="container-x flex flex-1 flex-col items-center justify-center py-24 text-center lg:py-36">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 text-5xl md:text-7xl">Page not found</h1>
        <p className="mt-5 max-w-md text-lg text-muted">The page you are looking for has moved or never existed. Let us take you somewhere comfortable.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button href="/" icon={<ArrowRight size={15} />}>
            Back to home
          </Button>
          <Button href="/shop" variant="outline">
            Browse products
          </Button>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </SiteProvider>
  );
}
