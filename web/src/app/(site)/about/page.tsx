import type { Metadata } from 'next';
import { Img as Image } from '@/components/ui/img';
import { ArrowRight } from 'lucide-react';
import { getSettings } from '@/lib/api';
import { resolveImage } from '@/lib/utils';
import { FeatureIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Markdown } from '@/components/ui/markdown';
import { Reveal } from '@/components/ui/reveal';
import { SplitHeading } from '@/components/ui/split-heading';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatsCounter } from '@/components/site/stats-counter';
import { SocialLinks } from '@/components/site/social-links';

export const metadata: Metadata = { title: 'About us' };

export default async function AboutPage() {
  const settings = await getSettings();
  const { about } = settings;

  return (
    <div>
      <section className="container-x py-8 lg:py-12">
        <Breadcrumbs items={[{ label: 'About' }]} />
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            {about.heroEyebrow && (
              <Reveal>
                <p className="eyebrow mb-4">{about.heroEyebrow}</p>
              </Reveal>
            )}
            <SplitHeading as="h1" text={about.heroTitle} className="text-4xl leading-[1.05] md:text-6xl lg:text-7xl" immediate />
          </div>
          <Reveal delay={0.3} className="lg:col-span-5">
            <p className="text-lg leading-relaxed text-muted">{about.heroText}</p>
          </Reveal>
        </div>
        {about.heroImage && (
          <Reveal delay={0.35} className="relative mt-12 aspect-[16/8] overflow-hidden bg-surface">
            <Image src={resolveImage(about.heroImage)} alt={about.heroTitle} fill priority sizes="100vw" className="object-cover" />
          </Reveal>
        )}
      </section>

      {about.stats.length > 0 && (
        <section className="container-x pb-20 lg:pb-28">
          <StatsCounter stats={about.stats} />
        </section>
      )}

      <section className="container-x grid items-center gap-12 pb-20 lg:grid-cols-2 lg:gap-20 lg:pb-28">
        {about.storyImage && (
          <Reveal className="relative aspect-[4/5] overflow-hidden bg-surface">
            <Image src={resolveImage(about.storyImage)} alt={about.storyTitle} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
        )}
        <div>
          <SplitHeading text={about.storyTitle} className="text-3xl leading-[1.1] md:text-[2.75rem]" />
          <Reveal delay={0.15} className="mt-8">
            <Markdown content={about.story} />
          </Reveal>
        </div>
      </section>

      {about.values.length > 0 && (
        <section className="bg-surface">
          <div className="container-x py-20 lg:py-28">
            <SectionHeading eyebrow="Our values" title={about.valuesTitle} align="center" />
            <Reveal stagger={0.1} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {about.values.map((v, i) => (
                <div key={`${v.title}-${i}`} className="bg-white p-8">
                  <FeatureIcon name={v.icon} size={28} className="text-accent" />
                  <h3 className="mt-5 font-display text-xl">{v.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{v.text}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      <section className="container-x py-20 text-center lg:py-28">
        <SplitHeading text={about.ctaTitle || 'Have a project in mind?'} className="mx-auto max-w-3xl text-3xl md:text-5xl" />
        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{about.ctaText}</p>
        </Reveal>
        <Reveal delay={0.25} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/contact" size="lg" magnetic icon={<ArrowRight size={15} />}>
            Get in touch
          </Button>
          <Button href="/shop" variant="outline" size="lg">
            Browse the collection
          </Button>
        </Reveal>
        <Reveal delay={0.35} className="mt-10 flex justify-center">
          <SocialLinks settings={settings} />
        </Reveal>
      </section>
    </div>
  );
}
