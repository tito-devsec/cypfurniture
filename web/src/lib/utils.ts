import { clsx, type ClassValue } from 'clsx';
import type { CommerceSettings } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Turns API-relative upload paths (/uploads/..) into absolute urls; passes other urls through. */
export function resolveImage(url?: string | null, fallback = '/placeholder.svg'): string {
  if (!url) return fallback;
  if (url.startsWith('/uploads/')) return `${PUBLIC_API}${url}`;
  return url;
}

export function formatPrice(amount: number, commerce: Pick<CommerceSettings, 'currencySymbol' | 'currencyPosition' | 'decimals'>): string {
  const n = amount.toLocaleString('en-US', {
    minimumFractionDigits: commerce.decimals,
    maximumFractionDigits: commerce.decimals,
  });
  return commerce.currencyPosition === 'after' ? `${n} ${commerce.currencySymbol}` : `${commerce.currencySymbol}${n}`;
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** https://wa.me/<digits>?text=... */
export function whatsappLink(number: string, text?: string): string {
  const digits = (number || '').replace(/\D/g, '');
  if (!digits) return '#';
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function telLink(phone: string): string {
  return `tel:${(phone || '').replace(/[^\d+]/g, '')}`;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  return dateTimeFormatter.format(new Date(iso));
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, max = 140): string {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}
