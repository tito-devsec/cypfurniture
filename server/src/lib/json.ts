/** Parse a JSON column safely, returning `fallback` on error. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge `patch` into `base`. Arrays are replaced, objects are merged. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = (base as Record<string, unknown>)[key];
    out[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return out as T;
}

/** Normalise a comma separated string or string[] into a trimmed, de-duplicated list. */
export function toList(value: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(value) ? value : (value || '').split(',');
  return [...new Set(raw.map((v) => String(v).trim()).filter(Boolean))];
}

/** Pick the first string value from an express query parameter. */
export function str(value: unknown): string {
  if (Array.isArray(value)) return str(value[0]);
  return typeof value === 'string' ? value.trim() : '';
}

export function int(value: unknown, fallback: number): number {
  const n = Number.parseInt(str(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function num(value: unknown): number | undefined {
  const s = str(value);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
