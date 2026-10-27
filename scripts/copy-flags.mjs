// Copies the round country flags from the `circle-flags` package into web/public/flags
// so the currency chooser works without any external CDN.
//
//   node scripts/copy-flags.mjs
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', 'circle-flags', 'flags');
const dest = path.join(root, 'web', 'public', 'flags');

mkdirSync(dest, { recursive: true });
let count = 0;
for (const file of readdirSync(src)) {
  if (!file.endsWith('.svg')) continue;
  copyFileSync(path.join(src, file), path.join(dest, file));
  count++;
}
console.log(`Copied ${count} flags to web/public/flags`);
