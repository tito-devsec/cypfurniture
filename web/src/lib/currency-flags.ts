/**
 * Maps ISO 4217 currency codes to the ISO 3166 country flag shown in the currency chooser.
 * Flags live in /public/flags (copied from the `circle-flags` package by scripts/copy-flags.mjs).
 */
const FLAG_OVERRIDES: Record<string, string> = {
  EUR: 'eu',
  GBP: 'gb',
  XOF: 'sn',
  XAF: 'cm',
  XCD: 'ag',
  XPF: 'pf',
  ANG: 'cw',
  AWG: 'aw',
  KYD: 'ky',
};

/** Country code (lowercase) for a currency, or null when unknown. */
export function flagCountry(currencyCode: string): string | null {
  const code = currencyCode.trim().toUpperCase();
  if (FLAG_OVERRIDES[code]) return FLAG_OVERRIDES[code];
  // Most ISO 4217 codes start with the ISO 3166 alpha-2 country code (TZS -> tz, USD -> us, KES -> ke).
  if (/^[A-Z]{3}$/.test(code)) return code.slice(0, 2).toLowerCase();
  return null;
}

export function flagSrc(currencyCode: string): string | null {
  const cc = flagCountry(currencyCode);
  return cc ? `/flags/${cc}.svg` : null;
}

/** Display names for common currencies (used for the shop's base currency and as a fallback). */
export const CURRENCY_NAMES: Record<string, string> = {
  TZS: 'Tanzanian Shilling',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  OMR: 'Omani Rial',
  BHD: 'Bahraini Dinar',
  KES: 'Kenyan Shilling',
  UGX: 'Ugandan Shilling',
  RWF: 'Rwandan Franc',
  BIF: 'Burundian Franc',
  ETB: 'Ethiopian Birr',
  ZAR: 'South African Rand',
  ZMW: 'Zambian Kwacha',
  MWK: 'Malawian Kwacha',
  MZN: 'Mozambican Metical',
  NGN: 'Nigerian Naira',
  GHS: 'Ghanaian Cedi',
  EGP: 'Egyptian Pound',
  MAD: 'Moroccan Dirham',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  KRW: 'South Korean Won',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  MYR: 'Malaysian Ringgit',
  THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah',
  PKR: 'Pakistani Rupee',
  TRY: 'Turkish Lira',
  RUB: 'Russian Ruble',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar',
  CHF: 'Swiss Franc',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  CZK: 'Czech Koruna',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
};

export function currencyName(code: string, fallback = ''): string {
  return CURRENCY_NAMES[code.toUpperCase()] || fallback || code.toUpperCase();
}
