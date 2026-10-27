'use client';

import Link from 'next/link';
import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X, type LucideIcon } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

/* ----------------------------------------------------------------- layout */

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent">
            <ChevronLeft size={14} /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type CardAccent = 'none' | 'red' | 'orange' | 'dark';

const cardHeaderTones: Record<CardAccent, string> = {
  none: 'border-b border-line bg-[#faf7f3] text-ink',
  red: 'bg-brand text-white',
  orange: 'bg-accent-2 text-ink',
  dark: 'bg-ink text-white',
};

export function Card({
  title,
  description,
  children,
  className,
  actions,
  accent = 'none',
  padded = true,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  accent?: CardAccent;
  padded?: boolean;
}) {
  return (
    <section className={cn('admin-card overflow-hidden', className)}>
      {(title || actions) && (
        <header className={cn('flex items-center justify-between gap-4 px-5 py-3', cardHeaderTones[accent])}>
          <div>
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {description && <p className={cn('mt-0.5 text-xs', accent === 'none' ? 'text-muted' : 'opacity-80')}>{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  );
}

const tileTones = {
  white: 'bg-white text-ink border border-line/80',
  red: 'bg-brand text-white',
  orange: 'bg-accent-2 text-ink',
  dark: 'bg-ink text-white',
};

/** Solid KPI tile (dashboard, sidebar). */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'white',
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof tileTones;
  href?: string;
  className?: string;
}) {
  const inner = (
    <div className={cn('flex h-full items-start justify-between gap-4 rounded-lg p-5 shadow-card', tileTones[tone], className)}>
      <div className="min-w-0">
        <p className={cn('text-[11px] font-semibold uppercase tracking-[0.12em]', tone === 'white' ? 'text-muted' : 'opacity-80')}>{label}</p>
        <p className="mt-2 truncate text-[28px] font-semibold leading-none tracking-tight">{value}</p>
        {sub && <p className={cn('mt-2 text-xs', tone === 'white' ? 'text-muted' : 'opacity-85')}>{sub}</p>}
      </div>
      {Icon && (
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tone === 'white' ? 'bg-accent-soft text-accent' : tone === 'orange' ? 'bg-ink/10' : 'bg-white/15')}>
          <Icon size={22} strokeWidth={1.8} />
        </span>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full transition-transform duration-200 hover:-translate-y-0.5">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ProgressBar({ value, max, tone = 'red', className }: { value: number; max: number; tone?: 'red' | 'orange' | 'dark' | 'green'; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = { red: 'bg-accent', orange: 'bg-accent-2', dark: 'bg-ink', green: 'bg-success' };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-line/70', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', colors[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 size={20} className={cn('animate-spin text-accent', className)} aria-label="Loading" />;
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner />
    </div>
  );
}

/* ----------------------------------------------------------------- buttons */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent' | 'dark';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-sm hover:bg-brand',
  accent: 'bg-accent-2 text-ink shadow-sm hover:brightness-95',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  secondary: 'border border-line bg-white text-ink hover:border-line-strong hover:bg-cream',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger hover:text-white',
  ghost: 'text-ink hover:bg-surface',
};

export function AdminButton({
  variant = 'primary',
  size = 'md',
  href,
  loading,
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; href?: string; loading?: boolean; icon?: ReactNode }) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
    variants[variant],
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- forms */

export function Field({ label, children, hint, error, className, required }: { label: string; children: ReactNode; hint?: string; error?: string; className?: string; required?: boolean }) {
  return (
    <label className={cn('block', className)}>
      <span className="admin-label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('admin-input', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('admin-input min-h-[100px] resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'admin-input appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2377746c%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-line-strong')}
      >
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-accent" />
      {label}
    </label>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-5 md:grid-cols-2', className)}>{children}</div>;
}

/* ----------------------------------------------------------------- tabs */

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn('whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors', value === t.id ? 'bg-accent text-white shadow-sm' : 'text-muted hover:bg-cream hover:text-ink')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- table + pagination */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('admin-card overflow-x-auto', className)}>
      <table className="admin-table">{children}</table>
    </div>
  );
}

export function PaginationControls({ page, pages, total, onChange }: { page: number; pages: number; total: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-1">
        <AdminButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} icon={<ChevronLeft size={14} />}>
          Prev
        </AdminButton>
        <AdminButton variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight size={14} />
        </AdminButton>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, children, width = 'max-w-2xl', footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string; footer?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current || !open) return;
      gsap.fromTo(root.current.querySelector('.modal-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(root.current.querySelector('.modal-panel'), { y: 16, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
    },
    { dependencies: [open], scope: root },
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal-backdrop absolute inset-0 bg-ink/50" onClick={onClose} aria-label="Close" />
      <div className={cn('modal-panel relative flex max-h-[92vh] w-full flex-col rounded-t-lg bg-white shadow-soft sm:rounded-lg', width)}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel = 'Delete', loading }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; text?: string; confirmLabel?: string; loading?: boolean }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{text || 'This action cannot be undone.'}</p>
    </Modal>
  );
}

/* ----------------------------------------------------------------- status badge */

const statusTones: Record<string, string> = {
  pending: 'bg-accent-2/20 text-[#8a5200]',
  confirmed: 'bg-accent-soft text-accent',
  processing: 'bg-accent-soft text-accent',
  shipped: 'bg-ink/10 text-ink',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]', statusTones[status] || 'bg-surface text-muted')}>{status}</span>;
}
