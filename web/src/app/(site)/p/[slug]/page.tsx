import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Markdown } from '@/components/ui/markdown';
import { Reveal } from '@/components/ui/reveal';
import { SplitHeading } from '@/components/ui/split-heading';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title ?? 'Page not found' };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <div className="container-x py-8 lg:py-12">
      <Breadcrumbs items={[{ label: page.title }]} />
      <div className="mx-auto mt-10 max-w-3xl">
        <SplitHeading as="h1" text={page.title} className="text-4xl leading-[1.05] md:text-6xl" immediate />
        <Reveal delay={0.2}>
          <p className="mt-3 text-sm text-muted">Last updated {formatDate(page.updatedAt)}</p>
        </Reveal>
        <Reveal delay={0.3} className="mt-10">
          <Markdown content={page.content} />
        </Reveal>
      </div>
    </div>
  );
}
