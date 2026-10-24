import { Star } from 'lucide-react';
import type { Testimonial } from '@/lib/types';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';

export function Testimonials({ title, subtitle, items }: { title: string; subtitle?: string; items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-surface">
      <div className="container-x py-20 md:py-28">
        <SectionHeading title={title} subtitle={subtitle} align="center" />
        <Reveal stagger={0.12} className="grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <figure key={`${t.name}-${i}`} className="flex flex-col bg-white p-8 md:p-10">
              <div className="flex gap-1 text-accent" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={14} className={s < t.rating ? 'fill-current' : 'text-line-strong'} strokeWidth={1.5} />
                ))}
              </div>
              <blockquote className="mt-6 flex-1 font-display text-[19px] leading-relaxed text-ink">“{t.quote}”</blockquote>
              <figcaption className="mt-8 border-t border-line pt-5">
                <p className="text-sm font-medium">{t.name}</p>
                {t.role && <p className="text-xs text-muted">{t.role}</p>}
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
