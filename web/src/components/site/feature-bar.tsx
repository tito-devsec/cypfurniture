import type { Feature } from '@/lib/types';
import { FeatureIcon } from '@/components/icons';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

export function FeatureBar({ features, className }: { features: Feature[]; className?: string }) {
  if (!features.length) return null;
  return (
    <section className={cn('border-b border-line', className)}>
      <Reveal stagger={0.08} className="container-x grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12">
        {features.map((f, i) => (
          <div key={`${f.title}-${i}`} className="flex flex-col items-center text-center">
            <FeatureIcon name={f.icon} size={30} className="text-ink" />
            <h3 className="mt-4 font-display text-[17px]">{f.title}</h3>
            <p className="mt-1 text-[13px] text-muted">{f.subtitle}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
