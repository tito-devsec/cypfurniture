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

export type MoneyFormat = { symbol: string; position?: 'before' | 'after'; decimals?: number; code?: string };

/** Formats an amount with a currency symbol. Letter symbols (TSh, AED, KSh) get a space, signs ($, €) do not. */
export function formatMoney(amount: number, c: MoneyFormat): string {
  const decimals = c.decimals ?? 0;
  const n = amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const symbol = c.symbol || c.code || '';
  if ((c.position ?? 'before') === 'after') return `${n} ${symbol}`;
  return /[A-Za-z]/.test(symbol) ? `${symbol} ${n}` : `${symbol}${n}`;
}

/** Formats an amount in the shop's base currency (admin, orders, emails). */
export function formatPrice(amount: number, commerce: Pick<CommerceSettings, 'currencySymbol' | 'currencyPosition' | 'decimals'>): string {
  return formatMoney(amount, { symbol: commerce.currencySymbol, position: commerce.currencyPosition, decimals: commerce.decimals });
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

/** Public url of the customer website (the admin runs separately). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export function siteUrl(pathname = '/'): string {
  return `${SITE_URL}${pathname}`;
}

/** "5 min ago", "3 h ago", "2 d ago" or the date for older items. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

/** Up to two initials from a name ("Adrian Demian" -> "AD"). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
