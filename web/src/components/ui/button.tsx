'use client';

import Link from 'next/link';
import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'whatsapp' | 'white';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-accent',
  accent: 'bg-accent text-white hover:bg-ink',
  secondary: 'bg-surface text-ink hover:bg-accent-soft',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  ghost: 'text-ink hover:bg-surface',
  whatsapp: 'bg-whatsapp text-white hover:bg-[#1ebe5b]',
  white: 'bg-white text-ink hover:bg-ink hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[11px]',
  md: 'h-12 px-7 text-[12px]',
  lg: 'h-14 px-9 text-[13px]',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  magnetic?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  full?: boolean;
};

export const buttonClasses = (variant: Variant = 'primary', size: Size = 'md', full = false, className?: string) =>
  cn(
    'group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xs font-sans font-medium uppercase tracking-[0.16em] transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    full && 'w-full',
    className,
  );

/**
 * Flat button with an optional GSAP "magnetic" hover effect.
 * Renders a <Link> when `href` is given.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', href, external, magnetic, icon, iconPosition = 'right', loading, full, className, children, ...props },
  ref,
) {
  const wrap = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      if (!el || !magnetic || window.matchMedia('(hover: none)').matches) return;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * 0.25);
        yTo((e.clientY - (rect.top + rect.height / 2)) * 0.35);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      return () => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      };
    },
    { scope: wrap, dependencies: [magnetic] },
  );

  const content = (
    <>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {icon && iconPosition === 'left' && <span className="transition-transform duration-300 group-hover/btn:-translate-x-0.5">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="transition-transform duration-300 group-hover/btn:translate-x-0.5">{icon}</span>}
    </>
  );

  const classes = buttonClasses(variant, size, full, className);

  const inner = href ? (
    external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    ) : (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  ) : (
    <button ref={ref} className={classes} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  );

  if (!magnetic) return inner;
  return (
    <span ref={wrap} className={cn('inline-block', full && 'w-full')}>
      {inner}
    </span>
  );
});
