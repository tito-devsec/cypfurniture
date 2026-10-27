// Derives the site icons and the social-sharing image from the original logo.
// The logo itself is never redrawn: it is only cropped to its visible content and resized.
//
//   node scripts/generate-brand-assets.mjs
//
// Input:  web/public/logo.png            (original artwork, kept untouched)
// Output: web/public/logo-mark.png       (cropped lettermark used in the header, footer and admin)
//         web/src/app/icon.png           (favicon, 512 x 512, transparent)
//         web/src/app/apple-icon.png     (Apple touch icon, 180 x 180, warm cream background)
//         web/public/og-image.jpg        (1200 x 630 sharing image for WhatsApp, Facebook, X ...)

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'web/public/logo.png');
const PUBLIC = path.join(root, 'web/public');
const APP = path.join(root, 'web/src/app');

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const CREAM = { r: 246, g: 239, b: 234, alpha: 1 }; // #F6EFEA
const INK = '#141414';

const trimmed = await sharp(SRC).trim().toBuffer();

// 1. Cropped lettermark with a little breathing room
await sharp(trimmed)
  .extend({ top: 6, bottom: 6, left: 6, right: 6, background: TRANSPARENT })
  .png()
  .toFile(path.join(PUBLIC, 'logo-mark.png'));

// 2. Favicon (transparent square)
const mark440 = await sharp(trimmed).resize({ width: 440, height: 440, fit: 'inside' }).toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: TRANSPARENT } })
  .composite([{ input: mark440, gravity: 'centre' }])
  .png()
  .toFile(path.join(APP, 'icon.png'));

// 3. Apple touch icon (opaque, cream)
const mark140 = await sharp(trimmed).resize({ width: 140, height: 140, fit: 'inside' }).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: CREAM } })
  .composite([{ input: mark140, gravity: 'centre' }])
  .png()
  .toFile(path.join(APP, 'apple-icon.png'));

// 4. Open Graph image
const mark = await sharp(trimmed).resize({ width: 380, height: 300, fit: 'inside' }).toBuffer();
const markMeta = await sharp(mark).metadata();
const caption = Buffer.from(
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
     <text x="600" y="462" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" letter-spacing="7" fill="${INK}">CYP FURNITURE &amp; DECOR®</text>
     <text x="600" y="530" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="#5c5c5c">Beyond Furniture. Designed for Living.</text>
   </svg>`,
);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: CREAM } })
  .composite([
    { input: mark, left: Math.round((1200 - (markMeta.width ?? 380)) / 2), top: 95 },
    { input: caption, left: 0, top: 0 },
  ])
  .jpeg({ quality: 90 })
  .toFile(path.join(PUBLIC, 'og-image.jpg'));

console.log('Brand assets written: logo-mark.png, icon.png, apple-icon.png, og-image.jpg');
