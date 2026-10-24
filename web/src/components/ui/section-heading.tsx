import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';
import { SplitHeading } from './split-heading';
import { cn } from '@/lib/utils';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
};

export function SectionHeading({ eyebrow, title, subtitle, action, align = 'left', className, as = 'h2' }: Props) {
  const centered = align === 'center';
  return (
    <div className={cn('mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between', centered && 'md:flex-col md:items-center md:text-center', className)}>
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <Reveal>
            <p className="eyebrow mb-3">{eyebrow}</p>
          </Reveal>
        )}
        <SplitHeading as={as} text={title} className="text-3xl leading-[1.08] md:text-[2.75rem]" />
        {subtitle && (
          <Reveal delay={0.15}>
            <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{subtitle}</p>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={0.2}>
          <Link href={action.href} className="group inline-flex items-center gap-2 font-sans text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-accent">
            <span className="link-line group-hover:link-line-active">{action.label}</span>
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      )}
    </div>
  );
}
