import express from 'express';
import { requireAdmin } from '../lib/auth.ts';
import { getSettings, updateSettings, type SiteSettings } from '../lib/settings.ts';
import { HttpError } from '../middleware/error.ts';

export const currenciesRouter = express.Router();

// Free, key-less exchange rates (updated daily). Base = the shop currency.
const RATES_URL = (base: string) => `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 10 * 60 * 1000;
let lastAttempt = 0;

/** Fetches fresh rates when the stored ones are older than a day (or the base currency changed). */
async function refreshRates(force = false): Promise<SiteSettings> {
  const settings = await getSettings();
  const base = settings.commerce.currencyCode.toUpperCase();
  const { list, updatedAt, autoUpdate, ratesBase } = settings.currencies;
  const stale = !updatedAt || ratesBase !== base || Date.now() - new Date(updatedAt).getTime() > REFRESH_AFTER_MS;
  if (!force && (!autoUpdate || !stale || Date.now() - lastAttempt < RETRY_AFTER_MS)) return settings;
  lastAttempt = Date.now();

  const res = await fetch(RATES_URL(base), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new HttpError(502, `Exchange-rate service responded with ${res.status}`);
  const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
  if (data.result !== 'success' || !data.rates) throw new HttpError(502, 'Exchange-rate service returned an unexpected response');
  const rates = data.rates;
  const updated = list.map((c) => (typeof rates[c.code] === 'number' && rates[c.code] > 0 ? { ...c, rate: rates[c.code] } : c));
  return updateSettings({ currencies: { list: updated, updatedAt: new Date().toISOString(), ratesBase: base } });
}

export async function getCurrencyPayload() {
  let settings = await getSettings();
  try {
    settings = await refreshRates(false);
  } catch (err) {
    console.warn('[currencies] rate refresh failed:', (err as Error).message);
  }
  const { commerce, currencies } = settings;
  return {
    enabled: currencies.enabled,
    base: { code: commerce.currencyCode, symbol: commerce.currencySymbol, position: commerce.currencyPosition, decimals: commerce.decimals },
    updatedAt: currencies.updatedAt,
    list: currencies.enabled ? currencies.list.filter((c) => c.code !== commerce.currencyCode.toUpperCase() && c.rate > 0) : [],
  };
}

/** Public: base currency + conversion rates for the storefront selector. */
currenciesRouter.get('/', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(await getCurrencyPayload());
});

/** Admin: force a refresh from the exchange-rate service. */
currenciesRouter.post('/refresh', requireAdmin, async (_req, res) => {
  const settings = await refreshRates(true);
  res.json({ ok: true, updatedAt: settings.currencies.updatedAt, list: settings.currencies.list });
});
