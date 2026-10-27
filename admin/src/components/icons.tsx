import type { SVGProps } from 'react';
import {
  Award,
  Box,
  Clock,
  CreditCard,
  Gem,
  Hammer,
  Headset,
  Heart,
  Leaf,
  Phone,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size?: number) => ({ width: size ?? 20, height: size ?? 20, viewBox: '0 0 24 24', fill: 'currentColor' });

export function TikTokIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.36-2.47V9.66a5.72 5.72 0 0 0-.77-.05A5.68 5.68 0 0 0 4.2 15.3 5.68 5.68 0 0 0 9.86 21a5.68 5.68 0 0 0 5.68-5.68V9.07a7.35 7.35 0 0 0 4.3 1.38V7.36a4.3 4.3 0 0 1-3.24-1.54Z" />
    </svg>
  );
}

export function WhatsAppIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function InstagramIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3Z" />
    </svg>
  );
}

export function YouTubeIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.3 5 12 5 12 5s-6.3 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.7 19 12 19 12 19s6.3 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z" />
    </svg>
  );
}

export function PinterestIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.64 19.31c-.09-.78-.17-1.98.03-2.84.18-.77 1.17-4.94 1.17-4.94s-.3-.6-.3-1.48c0-1.39.8-2.42 1.8-2.42.85 0 1.26.64 1.26 1.4 0 .86-.54 2.14-.83 3.32-.23.99.5 1.8 1.47 1.8 1.77 0 3.13-1.87 3.13-4.56 0-2.38-1.71-4.05-4.16-4.05-2.83 0-4.5 2.13-4.5 4.32 0 .86.33 1.78.74 2.28a.3.3 0 0 1 .07.29l-.28 1.13c-.04.18-.14.22-.33.13-1.25-.58-2.03-2.4-2.03-3.87 0-3.15 2.29-6.04 6.6-6.04 3.46 0 6.16 2.47 6.16 5.77 0 3.44-2.17 6.21-5.18 6.21-1.01 0-1.96-.53-2.29-1.15l-.62 2.37c-.23.87-.84 1.96-1.25 2.62A10 10 0 1 0 12 2Z" />
    </svg>
  );
}

export function XIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M17.5 3h3l-6.8 7.8L21.7 21h-6.2l-4.9-6.4L5 21H2l7.3-8.3L2 3h6.3l4.4 5.8L17.5 3Zm-1.1 16.2h1.7L7.1 4.7H5.3l11.1 14.5Z" />
    </svg>
  );
}

export function LinkedInIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props} aria-hidden="true">
      <path d="M6.5 8.5H3.2V21h3.3V8.5ZM4.85 3a1.95 1.95 0 1 0 0 3.9 1.95 1.95 0 0 0 0-3.9ZM21 13.3c0-3.4-1.8-5-4.3-5-2 0-2.9 1.1-3.4 1.9V8.5H10V21h3.3v-6.9c0-1.8.3-3.6 2.6-3.6 2.2 0 2.2 2 2.2 3.7V21H21v-7.7Z" />
    </svg>
  );
}

/** Icon names that can be chosen in the admin for trust badges / values. */
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  shield: ShieldCheck,
  ruler: Ruler,
  refresh: RefreshCw,
  hammer: Hammer,
  leaf: Leaf,
  sparkles: Sparkles,
  heart: Heart,
  star: Star,
  clock: Clock,
  phone: Phone,
  award: Award,
  box: Box,
  headset: Headset,
  card: CreditCard,
  gem: Gem,
  wrench: Wrench,
};

export const FEATURE_ICON_NAMES = Object.keys(FEATURE_ICONS);

export function FeatureIcon({ name, className, size = 26 }: { name: string; className?: string; size?: number }) {
  const Icon = FEATURE_ICONS[name] || Sparkles;
  return <Icon className={className} size={size} strokeWidth={1.4} aria-hidden="true" />;
}
