import type { Metadata } from 'next';
import { getPosts } from '@/lib/api';
import { BlogCard } from '@/components/site/blog-card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Pagination } from '@/components/ui/pagination';
import { Reveal } from '@/components/ui/reveal';
import { SplitHeading } from '@/components/ui/split-heading';

export const metadata: Metadata = { title: 'Blog', description: 'Ideas, buying guides and stories from the CYP workshop.' };

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const tag = Array.isArray(sp.tag) ? sp.tag[0] : sp.tag;
  const result = await getPosts({ page, limit: 9, tag });
  const [first, ...rest] = result.items;

  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Blog' }]} />
      <header className="mt-8 mb-12 max-w-2xl lg:mb-16">
        <p className="eyebrow mb-3">Journal</p>
        <SplitHeading as="h1" text={tag ? `Posts tagged “${tag}”` : 'Inspiration & tips'} className="text-4xl leading-[1.05] md:text-6xl" immediate />
        <Reveal delay={0.2}>
          <p className="mt-5 text-lg text-muted">Buying guides, design ideas and a look behind the scenes of our workshop.</p>
        </Reveal>
      </header>

      {result.items.length === 0 ? (
        <p className="py-20 text-center text-muted">No posts yet. Check back soon.</p>
      ) : (
        <>
          {page === 1 && first && !tag && (
            <Reveal className="mb-16">
              <BlogCard post={first} large />
            </Reveal>
          )}
          <Reveal stagger={0.1} className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {(page === 1 && !tag ? rest : result.items).map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </Reveal>
          <Pagination page={page} pages={result.pages} basePath="/blog" params={{ tag }} />
        </>
      )}
    </div>
  );
}
