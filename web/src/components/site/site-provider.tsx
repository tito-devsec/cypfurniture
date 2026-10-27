'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CategoryNode, CurrencyBase, CurrencyOption, CurrencyPayload, SiteSettings } from '@/lib/types';
import { CURRENCY_COOKIE, formatMoney } from '@/lib/utils';

type SiteContextValue = {
  settings: SiteSettings;
  categories: CategoryNode[];
  currencies: CurrencyPayload;
  /** Currently selected display currency code */
  currency: string;
  setCurrency: (code: string) => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

type Props = {
  settings: SiteSettings;
  categories: CategoryNode[];
  currencies?: CurrencyPayload | null;
  /** Code read from the visitor's cookie on the server, so the first render already uses it */
  initialCurrency?: string | null;
  children: ReactNode;
};

export function SiteProvider({ settings, categories, currencies, initialCurrency, children }: Props) {
  const payload = useMemo<CurrencyPayload>(
    () =>
      currencies ?? {
        enabled: false,
        base: { code: settings.commerce.currencyCode, symbol: settings.commerce.currencySymbol, position: settings.commerce.currencyPosition, decimals: settings.commerce.decimals },
        updatedAt: '',
        list: [],
      },
    [currencies, settings.commerce],
  );
  const [currency, setCurrencyState] = useState(() =>
    initialCurrency && payload.list.some((c) => c.code === initialCurrency) ? initialCurrency : payload.base.code,
  );
  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    try {
      document.cookie = `${CURRENCY_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ settings, categories, currencies: payload, currency, setCurrency }), [settings, categories, payload, currency, setCurrency]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
}

export function useSettings(): SiteSettings {
  return useSite().settings;
}

export function useCommerce() {
  return useSite().settings.commerce;
}

/**
 * Money formatting in the visitor's selected currency. Prices are stored in the base
 * currency; `format` converts them for display, `formatBase` never converts (orders, invoices).
 */
export function useMoney() {
  const { currencies, currency, setCurrency } = useSite();
  const base: CurrencyBase = currencies.base;
  const option: CurrencyOption | null = currencies.list.find((c) => c.code === currency) ?? null;

  const format = useCallback(
    (amount: number) => (option ? formatMoney(amount * option.rate, { symbol: option.symbol || option.code, position: 'before', decimals: option.decimals }) : formatMoney(amount, base)),
    [option, base],
  );
  const formatBase = useCallback((amount: number) => formatMoney(amount, base), [base]);

  return { format, formatBase, currency, setCurrency, options: currencies.list, base, isBase: option === null, updatedAt: currencies.updatedAt };
}
