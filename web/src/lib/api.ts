import { cache } from 'react';
import type { BlogPost, Category, CategoryNode, CurrencyPayload, Page, Paginated, Product, SiteSettings } from './types';
import { FALLBACK_SETTINGS } from './fallback-settings';

/** API base url: server components use API_URL, the browser uses NEXT_PUBLIC_API_URL. */
export const API_BASE =
  typeof window === 'undefined'
    ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  details?: { path: string; message: string }[];
  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type FetchOptions = RequestInit & { token?: string | null };

/** Fetch JSON from the API. Storefront requests are never cached so admin changes show immediately. */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    let details: ApiError['details'];
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      details = body?.details;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message, details);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

// ------------------------------------------------------------------ storefront loaders (server components)

/** Site settings, de-duplicated per request. Falls back to defaults when the API is down. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await apiFetch<SiteSettings>('/api/settings');
  } catch (err) {
    console.error('[cyp] Could not load settings from the API:', (err as Error).message);
    return FALLBACK_SETTINGS;
  }
});

/** Base currency + conversion rates for the storefront currency selector. */
export const getCurrencies = cache(async (): Promise<CurrencyPayload | null> => {
  try {
    return await apiFetch<CurrencyPayload>('/api/currencies');
  } catch {
    return null;
  }
});

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  try {
    return await apiFetch<CategoryNode[]>('/api/categories?tree=1');
  } catch {
    return [];
  }
});

export async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>('/api/categories');
  } catch {
    return [];
  }
}

export async function getCategory(slug: string): Promise<(Category & { children: Category[]; parent: Category | null }) | null> {
  try {
    return await apiFetch(`/api/categories/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export type ProductQuery = {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  new?: boolean;
  bestseller?: boolean;
  sale?: boolean;
  minPrice?: number;
  maxPrice?: number;
};

export async function getProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  try {
    return await apiFetch<Paginated<Product>>(
      `/api/products${qs({
        q: query.q,
        category: query.category,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
        featured: query.featured ? 1 : undefined,
        new: query.new ? 1 : undefined,
        bestseller: query.bestseller ? 1 : undefined,
        sale: query.sale ? 1 : undefined,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
      })}`,
    );
  } catch {
    return { items: [], total: 0, page: 1, pages: 0, limit: query.limit ?? 12 };
  }
}

export async function getProduct(slug: string): Promise<{ product: Product; related: Product[] } | null> {
  try {
    return await apiFetch(`/api/products/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  try {
    return await apiFetch('/api/products/meta/price-range');
  } catch {
    return { min: 0, max: 0 };
  }
}

export async function getPosts(query: { page?: number; limit?: number; tag?: string; q?: string } = {}): Promise<Paginated<BlogPost>> {
  try {
    return await apiFetch<Paginated<BlogPost>>(`/api/posts${qs(query)}`);
  } catch {
    return { items: [], total: 0, page: 1, pages: 0, limit: query.limit ?? 9 };
  }
}

export async function getPost(slug: string): Promise<{ post: BlogPost; related: BlogPost[] } | null> {
  try {
    return await apiFetch(`/api/posts/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getPage(slug: string): Promise<Page | null> {
  try {
    return await apiFetch<Page>(`/api/pages/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
