import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full rounded-xs border border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-300 focus:border-ink focus:outline-none disabled:opacity-60';

export function Field({ label, children, hint, error, className, required }: { label: string; children: ReactNode; hint?: string; error?: string; className?: string; required?: boolean }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
        {required && <span className="text-sale"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-sale">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-[140px] resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, 'appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
