import type { SiteSettings } from './types';

type Contact = Pick<SiteSettings['contact'], 'address' | 'city' | 'country' | 'mapPlaceName' | 'mapCoordinates' | 'mapEmbedOverride'>;

export type Coordinates = { lat: number; lng: number };

/** Parses "latitude, longitude" the way Google Maps copies it (e.g. "-6.7819, 39.2399"); null when empty or invalid. */
export function parseCoordinates(value?: string | null): Coordinates | null {
  const parts = (value || '').split(',').map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const addressText = (c: Contact) => [c.address, c.city, c.country].filter(Boolean).join(', ');

/** Where map links point: the exact coordinates when set, otherwise the postal address. */
function destination(c: Contact): string {
  const coords = parseCoordinates(c.mapCoordinates);
  return coords ? `${coords.lat},${coords.lng}` : addressText(c);
}

/**
 * Google Maps iframe src for the showroom, in order of preference:
 * the custom embed, the listing name at the coordinates (Google shows the listing card and a labelled pin),
 * a plain pin at the coordinates, then the postal address.
 * Note: a name Google cannot match near the coordinates shows the area without any pin.
 */
export function mapEmbedUrl(c: Contact): string {
  if (c.mapEmbedOverride) return c.mapEmbedOverride;
  const coords = parseCoordinates(c.mapCoordinates);
  const params = new URLSearchParams();
  if (coords) {
    const ll = `${coords.lat},${coords.lng}`;
    if (c.mapPlaceName.trim()) {
      params.set('q', c.mapPlaceName.trim());
      params.set('ll', ll);
    } else {
      params.set('q', ll);
    }
    params.set('z', '17');
  } else {
    const address = addressText(c);
    if (!address) return '';
    params.set('q', address);
    params.set('z', '15');
  }
  params.set('hl', 'en');
  params.set('output', 'embed');
  return `https://www.google.com/maps?${params.toString()}`;
}

/** Google Maps directions to the showroom. */
export function mapDirectionsUrl(c: Contact): string {
  const to = destination(c);
  return to ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(to)}` : '';
}

/** Google Maps page with a pin on the showroom. */
export function mapViewUrl(c: Contact): string {
  const to = destination(c);
  return to ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(to)}` : '';
}
