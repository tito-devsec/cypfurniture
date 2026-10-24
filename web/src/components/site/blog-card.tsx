import { Img as Image } from '@/components/ui/img';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import { cn, formatDate, resolveImage } from '@/lib/utils';

export function BlogCard({ post, className, large = false }: { post: BlogPost; className?: string; large?: boolean }) {
  return (
    <article className={cn('group flex flex-col', className)}>
      <Link href={`/blog/${post.slug}`} className={cn('relative block overflow-hidden bg-surface', large ? 'aspect-[16/9]' : 'aspect-[4/3]')}>
        {post.coverImage && <Image src={resolveImage(post.coverImage)} alt={post.title} fill sizes={large ? '(min-width: 1024px) 66vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'} className="img-zoom object-cover group-hover:scale-105" />}
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <p className="flex flex-wrap items-center gap-x-3 text-[11px] uppercase tracking-[0.18em] text-muted">
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          {post.tags[0] && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-accent">{post.tags[0]}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{post.readingTime} min read</span>
        </p>
        <h3 className={cn('mt-3 font-display leading-snug', large ? 'text-2xl md:text-3xl' : 'text-xl')}>
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-accent">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{post.excerpt}</p>}
        <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-accent">
          Read more <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
