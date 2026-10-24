import { getCategoryTree, getPosts, getProducts, getSettings } from '@/lib/api';
import { Hero } from '@/components/site/hero';
import { FeatureBar } from '@/components/site/feature-bar';
import { CategoryGrid } from '@/components/site/category-grid';
import { ProductGrid } from '@/components/site/product-grid';
import { ProductCarousel } from '@/components/site/product-carousel';
import { FullBanner, SplitBanner } from '@/components/site/banner';
import { Testimonials } from '@/components/site/testimonials';
import { BlogCard } from '@/components/site/blog-card';
import { Marquee } from '@/components/site/marquee';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/ui/reveal';

export default async function HomePage() {
  const settings = await getSettings();
  const { home } = settings;
  const [categories, featured, newArrivals, bestSellers, posts] = await Promise.all([
    getCategoryTree(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ new: true, limit: 8, sort: 'newest' }),
    getProducts({ bestseller: true, limit: 4, sort: 'popular' }),
    getPosts({ limit: 3 }),
  ]);

  return (
    <>
      <Hero slides={settings.hero.slides} autoplaySeconds={settings.hero.autoplaySeconds} />
      <FeatureBar features={settings.features} />

      {categories.length > 0 && (
        <section className="container-x py-20 md:py-28">
          <SectionHeading eyebrow="Collections" title={home.categoriesTitle} subtitle={home.categoriesSubtitle} action={{ label: 'All products', href: '/shop' }} />
          <CategoryGrid categories={categories} />
        </section>
      )}

      {featured.items.length > 0 && (
        <section className="container-x pb-20 md:pb-28">
          <SectionHeading eyebrow="Curated" title={home.featuredTitle} subtitle={home.featuredSubtitle} action={{ label: 'View all', href: '/shop' }} />
          <ProductGrid products={featured.items} priorityCount={4} />
        </section>
      )}

      <SplitBanner banner={home.showcase} className="pb-20 md:pb-28" />

      {settings.features.length > 0 && <Marquee items={settings.features.map((f) => f.title)} />}

      {newArrivals.items.length > 0 && (
        <section className="container-x py-20 md:py-28">
          <SectionHeading eyebrow="Just landed" title={home.newArrivalsTitle} action={{ label: 'See what is new', href: '/shop?new=1&sort=newest' }} />
          <ProductCarousel products={newArrivals.items} />
        </section>
      )}

      {bestSellers.items.length > 0 && (
        <section className="container-x pb-20 md:pb-28">
          <SectionHeading eyebrow="Customer favourites" title={home.bestSellersTitle} action={{ label: 'Shop best sellers', href: '/shop?bestseller=1' }} />
          <ProductGrid products={bestSellers.items} />
        </section>
      )}

      {home.testimonials.enabled && <Testimonials title={home.testimonials.title} subtitle={home.testimonials.subtitle} items={home.testimonials.items} />}

      {posts.items.length > 0 && (
        <section className="container-x py-20 md:py-28">
          <SectionHeading eyebrow="Journal" title={home.blogTitle} subtitle={home.blogSubtitle} action={{ label: 'Visit the blog', href: '/blog' }} />
          <Reveal stagger={0.12} className="grid gap-8 md:grid-cols-3">
            {posts.items.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </Reveal>
        </section>
      )}

      <FullBanner banner={home.banner} />
    </>
  );
}
