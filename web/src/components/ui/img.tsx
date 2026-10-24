import NextImage, { type ImageProps } from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Images uploaded through the admin (served by our API) and files in /public go through
 * Next's image optimizer. Images from third-party hosts (demo content, CDNs, admin-entered
 * urls) are loaded directly by the browser so the site never depends on the server being
 * able to reach those hosts.
 */
function skipOptimizer(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  if (src.endsWith('.svg')) return true;
  if (src.startsWith('/')) return false;
  if (src.startsWith(`${API}/`)) return false;
  return true;
}

export function Img(props: ImageProps) {
  return <NextImage {...props} unoptimized={props.unoptimized ?? skipOptimizer(props.src)} />;
}
