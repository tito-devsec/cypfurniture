import type { Metadata } from 'next';
import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/api';
import { formatDate, resolveImage } from '@/lib/utils';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Markdown } from '@/components/ui/markdown';
import { Reveal } from '@/components/ui/reveal';
import { SplitHeading } from '@/components/ui/split-heading';
import { SectionHeading } from '@/components/ui/section-heading';
import { BlogCard } from '@/components/site/blog-card';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: 'Post not found' };
  return {
    title: data.post.title,
    description: data.post.excerpt,
    openGraph: { title: data.post.title, description: data.post.excerpt, type: 'article', images: data.post.coverImage ? [resolveImage(data.post.coverImage)] : undefined },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();
  const { post, related } = data;

  return (
    <article className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Blog', href: '/blog' }, { label: post.title }]} />
      <header className="mx-auto mt-10 max-w-3xl text-center">
        <Reveal>
          <p className="flex flex-wrap items-center justify-center gap-x-3 text-[11px] uppercase tracking-[0.18em] text-muted">
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
            {post.author && (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.author}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </p>
        </Reveal>
        <SplitHeading as="h1" text={post.title} className="mt-5 text-4xl leading-[1.08] md:text-6xl" immediate />
        {post.excerpt && (
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg leading-relaxed text-muted">{post.excerpt}</p>
          </Reveal>
        )}
      </header>

      {post.coverImage && (
        <Reveal className="relative mx-auto mt-12 aspect-[16/8] max-w-5xl overflow-hidden bg-surface" delay={0.25}>
          <Image src={resolveImage(post.coverImage)} alt={post.title} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
        </Reveal>
      )}

      <div className="mx-auto mt-12 max-w-3xl lg:mt-16">
        <Markdown content={post.content} />
        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-8">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Tags</span>
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-ink">
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-16 lg:mt-28">
          <SectionHeading eyebrow="Keep reading" title="More from the journal" action={{ label: 'All posts', href: '/blog' }} />
          <Reveal stagger={0.1} className="grid gap-8 md:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </Reveal>
        </section>
      )}
    </article>
  );
}
