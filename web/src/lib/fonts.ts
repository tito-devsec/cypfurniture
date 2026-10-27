import type { BodyFont, HeadingFont } from './types';

/** Fonts the storefront bundles (next/font). `family` is the Google Fonts name, used for admin previews. */
export const HEADING_FONTS: { key: HeadingFont; label: string; family: string }[] = [
  { key: 'marcellus', label: 'Marcellus - elegant serif (default)', family: 'Marcellus' },
  { key: 'playfair', label: 'Playfair Display - classic serif', family: 'Playfair Display' },
  { key: 'cormorant', label: 'Cormorant Garamond - fine serif', family: 'Cormorant Garamond' },
  { key: 'dm-serif', label: 'DM Serif Display - bold serif', family: 'DM Serif Display' },
  { key: 'libre-baskerville', label: 'Libre Baskerville - book serif', family: 'Libre Baskerville' },
  { key: 'montserrat', label: 'Montserrat - modern sans', family: 'Montserrat' },
  { key: 'jost', label: 'Jost - geometric sans', family: 'Jost' },
];

export const BODY_FONTS: { key: BodyFont; label: string; family: string }[] = [
  { key: 'jost', label: 'Jost (default)', family: 'Jost' },
  { key: 'inter', label: 'Inter', family: 'Inter' },
  { key: 'montserrat', label: 'Montserrat', family: 'Montserrat' },
  { key: 'lato', label: 'Lato', family: 'Lato' },
  { key: 'nunito-sans', label: 'Nunito Sans', family: 'Nunito Sans' },
  { key: 'dm-sans', label: 'DM Sans', family: 'DM Sans' },
  { key: 'source-sans', label: 'Source Sans 3', family: 'Source Sans 3' },
];
