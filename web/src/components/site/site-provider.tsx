'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CategoryNode, SiteSettings } from '@/lib/types';

type SiteContextValue = { settings: SiteSettings; categories: CategoryNode[] };

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ settings, categories, children }: SiteContextValue & { children: ReactNode }) {
  return <SiteContext.Provider value={{ settings, categories }}>{children}</SiteContext.Provider>;
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
