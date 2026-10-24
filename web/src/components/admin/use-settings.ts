'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { FALLBACK_SETTINGS } from '@/lib/fallback-settings';
import type { SiteSettings } from '@/lib/types';

let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;

/** Site settings for admin pages (cached per browser session; call `invalidateSettings()` after saving). */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cached ?? FALLBACK_SETTINGS);
  const [loaded, setLoaded] = useState(Boolean(cached));
  useEffect(() => {
    if (cached) return;
    inflight ??= apiFetch<SiteSettings>('/api/settings');
    inflight
      .then((s) => {
        cached = s;
        setSettings(s);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);
  return { settings, commerce: settings.commerce, loaded };
}

export function invalidateSettings(next?: SiteSettings) {
  cached = next ?? null;
  inflight = null;
}
