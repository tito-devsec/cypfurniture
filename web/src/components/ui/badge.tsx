import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'ink' | 'sale' | 'accent' | 'accent2' | 'muted' | 'success' | 'warning' | 'danger' | 'surface';

const tones: Record<Tone, string> = {
  ink: 'bg-ink text-white',
  sale: 'bg-sale text-white',
  accent: 'bg-accent text-white',
  accent2: 'bg-accent-2 text-ink',
  muted: 'bg-surface text-muted',
  surface: 'bg-white text-ink border border-line',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ children, tone = 'ink', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-xs px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em]', tones[tone], className)}>
      {children}
    </span>
  );
}
